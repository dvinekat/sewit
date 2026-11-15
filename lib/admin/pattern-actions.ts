"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { AdminActionState } from "@/lib/admin/form-state";
import { publishBlockers, type SizeRowInput } from "@/lib/admin/pattern-form";
import { patternCreateSchema, PATTERN_FORM_FIELDS } from "@/lib/schemas/pattern-admin";
import { authFieldErrors } from "@/lib/schemas/auth";
import { requireAdmin } from "@/lib/auth/guards";
import { describeSupabaseError } from "@/lib/supabase/errors";
import { createServiceClient, hasServiceRoleKey } from "@/lib/supabase/service";

/**
 * CRUD выкроек в админке (T-39, FR-8.2).
 *
 * Все записи идут service_role: `pattern_files` политик не имеет вовсе, а
 * загрузка в Storage должна работать независимо от RLS. Поэтому каждый экшен
 * сначала проверяет роль через `requireAdmin`.
 *
 * Публикация двухступенчатая: сначала выкройка сохраняется, затем проверяется
 * готовность (обложка, таблица размеров, PDF на каждый размер). Если чего-то
 * не хватает, статус принудительно становится `draft` — «опубликовать наполовину»
 * нельзя (FR-8.2).
 */

const MAX_COVER_BYTES = 5 * 1024 * 1024;
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_MODEL_BYTES = 5 * 1024 * 1024;

const COVER_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const PDF_TYPES = ["application/pdf"];
const MODEL_TYPES = ["model/gltf-binary", "application/octet-stream", ""];

const PATTERN_PATH = "/admin/patterns";

const idSchema = z.string().uuid();

function valuesFrom(formData: FormData): Record<string, FormDataEntryValue> {
  const values: Record<string, FormDataEntryValue> = {};

  for (const key of PATTERN_FORM_FIELDS) {
    const value = formData.get(key);
    if (value !== null) values[key] = value;
  }

  return values;
}

function coverFile(formData: FormData): File | null {
  const value = formData.get("cover");
  return value instanceof File && value.size > 0 ? value : null;
}

function modelFile(formData: FormData): File | null {
  const value = formData.get("model3d");
  return value instanceof File && value.size > 0 ? value : null;
}

/** Путь файла в публичном бакете по его public URL; null — URL не из Storage. */
function publicBucketPath(url: string | null, bucket: string): string | null {
  const marker = `/object/public/${bucket}/`;
  const index = url?.indexOf(marker) ?? -1;

  return index >= 0 ? decodeURIComponent(url!.slice(index + marker.length)) : null;
}

/** PDF приходят как `pdf:<label>` — по подписи размера, а не по id строки. */
function pdfFiles(formData: FormData): Map<string, File> {
  const files = new Map<string, File>();

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("pdf:")) continue;
    if (!(value instanceof File) || value.size === 0) continue;

    files.set(key.slice(4).trim(), value);
  }

  return files;
}

function fileProblem(
  file: File,
  config: { maxBytes: number; types: string[]; label: string },
): string | null {
  if (file.size > config.maxBytes) {
    return `${config.label}: файл больше ${Math.round(config.maxBytes / 1024 / 1024)} МБ`;
  }

  if (file.type && !config.types.includes(file.type)) {
    return `${config.label}: неверный формат файла (${file.type})`;
  }

  return null;
}

function fileExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();

  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";

  return "jpg";
}

function slugTaken(): AdminActionState {
  return {
    status: "error",
    message: "Slug уже занят другой выкройкой: выберите другой адрес карточки.",
  };
}

function serviceError(context: string, error: unknown): AdminActionState {
  console.error(`[admin/patterns] ${context}`, error);
  return {
    status: "error",
    message: `Не удалось сохранить выкройку: ${describeSupabaseError(error)}`,
  };
}

/** Путь PDF внутри бакета `patterns` — как у демо-лекал: patterns/<slug>/<размер>/base.pdf. */
function pdfStoragePath(slug: string, label: string): string {
  return `patterns/${slug}/${label}/base.pdf`;
}

export async function createPatternAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  return savePattern("create", formData);
}

export async function updatePatternAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  return savePattern("update", formData);
}

async function savePattern(
  mode: "create" | "update",
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = patternCreateSchema.safeParse(valuesFrom(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Проверьте поля выкройки — сохранение остановлено.",
      fieldErrors: authFieldErrors(parsed.error, PATTERN_FORM_FIELDS),
    };
  }

  const updateId = mode === "update" ? idSchema.safeParse(formData.get("id")) : null;

  if (updateId && !updateId.success) {
    return { status: "error", message: "Некорректный идентификатор выкройки." };
  }

  const patternIdToUpdate = updateId?.success ? updateId.data : null;

  if (!hasServiceRoleKey()) {
    return {
      status: "error",
      message:
        "Сохранение выкройки с файлами недоступно: администратор не добавил SUPABASE_SERVICE_ROLE_KEY в .env.local.",
    };
  }

  const values = parsed.data;
  const service = createServiceClient();

  const { data: category } = await service
    .from("categories")
    .select("id")
    .eq("id", values.categoryId)
    .maybeSingle();

  if (!category) {
    return {
      status: "error",
      message: "Категория не найдена.",
      fieldErrors: { categoryId: "Выберите существующую категорию" },
    };
  }

  const cover = coverFile(formData);
  const model = modelFile(formData);
  const pdfs = pdfFiles(formData);

  if (cover) {
    const problem = fileProblem(cover, {
      maxBytes: MAX_COVER_BYTES,
      types: COVER_TYPES,
      label: "Обложка",
    });

    if (problem) return { status: "error", message: problem };
  }

  if (model) {
    const problem = fileProblem(model, {
      maxBytes: MAX_MODEL_BYTES,
      types: MODEL_TYPES,
      label: "3D-модель",
    });

    if (problem) return { status: "error", message: problem };

    if (!model.name.toLowerCase().endsWith(".glb")) {
      return { status: "error", message: "3D-модель: нужен файл формата .glb" };
    }
  }

  for (const [label, file] of pdfs) {
    const problem = fileProblem(file, {
      maxBytes: MAX_PDF_BYTES,
      types: PDF_TYPES,
      label: `PDF ${label || "без размера"}`,
    });

    if (problem) return { status: "error", message: problem };
  }

  const existingPattern =
    patternIdToUpdate !== null
      ? (
          await service
            .from("patterns")
            .select("id, slug, cover_url, model_3d_url, published_at")
            .eq("id", patternIdToUpdate)
            .maybeSingle<{
              id: string;
              slug: string;
              cover_url: string | null;
              model_3d_url: string | null;
              published_at: string | null;
            }>()
        ).data
      : null;

  if (mode === "update" && !existingPattern) {
    return { status: "error", message: "Выкройка не найдена: возможно, её уже удалили." };
  }

  // Удалять размеры, которые уже куплены, нельзя: у покупателя пропадёт доступ к PDF.
  const existingSizes =
    patternIdToUpdate !== null
      ? ((
          await service
            .from("pattern_sizes")
            .select("id, label")
            .eq("pattern_id", patternIdToUpdate)
        ).data ?? [])
      : [];

  const incomingLabels = new Set(values.sizes.map((size) => size.label));
  const removedLabels = existingSizes
    .map((size) => size.label as string)
    .filter((label) => !incomingLabels.has(label));

  if (removedLabels.length > 0 && patternIdToUpdate !== null) {
    const { data: soldRows } = await service
      .from("order_items")
      .select("size_label")
      .eq("pattern_id", patternIdToUpdate)
      .in("size_label", removedLabels);

    if ((soldRows ?? []).length > 0) {
      const sold = [...new Set((soldRows ?? []).map((row) => row.size_label as string))];
      return {
        status: "error",
        message: `Нельзя удалить размеры, которые уже куплены: ${sold.join(", ")}. Сначала верните их в таблицу.`,
        fieldErrors: { sizes: "Размеры с покупками нельзя удалять" },
      };
    }
  }

  let coverUrl = values.coverUrl;

  if (cover) {
    const path = `${values.slug}/cover-${Date.now()}.${fileExtension(cover)}`;
    const upload = await service.storage.from("covers").upload(path, cover, {
      contentType: cover.type || "image/jpeg",
      upsert: true,
      cacheControl: "31536000",
    });

    if (upload.error) return serviceError("cover upload", upload.error);

    coverUrl = service.storage.from("covers").getPublicUrl(path).data.publicUrl;
  }

  let model3dUrl = values.model3dUrl;

  if (model) {
    const path = `${values.slug}/model-${Date.now()}.glb`;
    const upload = await service.storage.from("models").upload(path, model, {
      contentType: "model/gltf-binary",
      upsert: true,
      cacheControl: "31536000",
    });

    if (upload.error) return serviceError("model upload", upload.error);

    model3dUrl = service.storage.from("models").getPublicUrl(path).data.publicUrl;
  }

  // Заменённую 3D-модель убираем из Storage: старый URL больше не нужен.
  const oldModelPath = existingPattern
    ? publicBucketPath(existingPattern.model_3d_url, "models")
    : null;
  if (model && oldModelPath) {
    const removed = await service.storage.from("models").remove([oldModelPath]);
    if (removed.error) console.error("[admin/patterns] old model remove", removed.error);
  }

  const payload = {
    slug: values.slug,
    title: values.title,
    description: values.description,
    category_id: values.categoryId,
    level: values.level,
    sewing_hours: values.sewingHours,
    fabric_note: values.fabricNote,
    materials: values.materials,
    allowances: values.allowances,
    price: values.priceRubles,
    cover_url: coverUrl,
    model_3d_url: model3dUrl,
  };

  let patternId: string;

  if (mode === "create") {
    const { data: created, error } = await service
      .from("patterns")
      .insert({ ...payload, status: "draft" })
      .select("id")
      .single<{ id: string }>();

    if (error) {
      return error.code === "23505" ? slugTaken() : serviceError("pattern insert", error);
    }

    patternId = created.id;
  } else {
    patternId = patternIdToUpdate!;

    const { data: updated, error } = await service
      .from("patterns")
      .update(payload)
      .eq("id", patternId)
      .select("id")
      .maybeSingle<{ id: string }>();

    if (error) {
      return error.code === "23505" ? slugTaken() : serviceError("pattern update", error);
    }

    if (!updated) return { status: "error", message: "Выкройка не найдена." };
  }

  // Таблица размеров: существующие обновляем по label, новые вставляем.
  const existingByLabel = new Map(
    existingSizes.map((size) => [size.label as string, size.id as string]),
  );
  const sizeIds = new Map<string, string>();

  for (const size of values.sizes) {
    const row = {
      pattern_id: patternId,
      label: size.label,
      bust: size.bust,
      waist: size.waist,
      hips: size.hips,
      height_min: size.heightMin,
      height_max: size.heightMax,
      fabric_consumption_m: size.fabricConsumption,
    };

    const sizeId = existingByLabel.get(size.label);

    if (sizeId) {
      const { error } = await service.from("pattern_sizes").update(row).eq("id", sizeId);
      if (error) return serviceError(`size ${size.label}`, error);
      sizeIds.set(size.label, sizeId);
    } else {
      const { data, error } = await service
        .from("pattern_sizes")
        .insert(row)
        .select("id")
        .single<{ id: string }>();

      if (error) return serviceError(`size ${size.label}`, error);
      sizeIds.set(size.label, data.id);
    }
  }

  if (removedLabels.length > 0) {
    const { error } = await service
      .from("pattern_sizes")
      .delete()
      .in("label", removedLabels)
      .eq("pattern_id", patternId);
    if (error) return serviceError("size delete", error);
  }

  // Параметры пресета: пересобираем целиком, значения — jsonb-массивом.
  const { error: paramsClearError } = await service
    .from("pattern_params")
    .delete()
    .eq("pattern_id", patternId);

  if (paramsClearError) return serviceError("params clear", paramsClearError);

  if (values.params.length > 0) {
    const { error } = await service.from("pattern_params").insert(
      values.params.map((param) => ({
        pattern_id: patternId,
        code: param.code,
        title: param.title,
        values: param.values,
      })),
    );

    if (error) return serviceError("params insert", error);
  }

  // PDF на каждый размер: загружаем, затем фиксируем путь в pattern_files.
  for (const [label, file] of pdfs) {
    const sizeId = sizeIds.get(label);

    if (!sizeId) {
      return {
        status: "error",
        message: `PDF «${file.name}» относится к размеру «${label}», которого нет в таблице.`,
      };
    }

    const storagePath = pdfStoragePath(values.slug, label);
    const upload = await service.storage.from("patterns").upload(storagePath, file, {
      contentType: "application/pdf",
      upsert: true,
    });

    if (upload.error) return serviceError(`pdf ${label}`, upload.error);

    const { error } = await service.from("pattern_files").upsert(
      {
        pattern_id: patternId,
        size_id: sizeId,
        variant_key: "none",
        format: "pdf_a4",
        storage_path: storagePath,
      },
      { onConflict: "pattern_id,size_id,variant_key,format" },
    );

    if (error) return serviceError(`pattern_files ${label}`, error);
  }

  // Итоговая готовность: считаем файлы по размерам уже из БД.
  const { data: finalSizes } = await service
    .from("pattern_sizes")
    .select("id, label")
    .eq("pattern_id", patternId);
  const { data: finalFiles } = await service
    .from("pattern_files")
    .select("size_id")
    .eq("pattern_id", patternId);
  const sizesWithFiles = new Set((finalFiles ?? []).map((file) => file.size_id as string));

  const publishSizes: SizeRowInput[] = (finalSizes ?? []).map((size) => ({
    key: size.id as string,
    label: size.label as string,
    bust: "",
    waist: "",
    hips: "",
    heightMin: "",
    heightMax: "",
    fabricConsumption: "",
    hasFile: sizesWithFiles.has(size.id as string),
  }));

  const blockers = publishBlockers({
    status: values.status,
    coverUrl: coverUrl ?? "",
    sizes: publishSizes,
  });

  const finalStatus = blockers.length > 0 ? "draft" : values.status;
  const publishedAt =
    finalStatus === "published"
      ? (existingPattern?.published_at ?? new Date().toISOString())
      : null;

  const { error: statusError } = await service
    .from("patterns")
    .update({ status: finalStatus, published_at: publishedAt })
    .eq("id", patternId);

  if (statusError) return serviceError("pattern status", statusError);

  revalidatePath(PATTERN_PATH);
  revalidatePath(`/patterns/${values.slug}`);
  revalidatePath("/catalog");
  revalidatePath("/");

  if (blockers.length > 0) {
    redirect(`${PATTERN_PATH}/${patternId}?blocked=${encodeURIComponent(blockers.join("; "))}`);
  }

  redirect(`${PATTERN_PATH}/${patternId}?saved=1`);
}

/** Удаление выкройки: покупки блокируют удаление, файлы убираем из Storage. */
export async function deletePatternAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = idSchema.safeParse(formData.get("id"));

  if (!id.success || !hasServiceRoleKey()) redirect(`${PATTERN_PATH}?error=delete`);

  const service = createServiceClient();

  const { count } = await service
    .from("order_items")
    .select("*", { count: "exact", head: true })
    .eq("pattern_id", id.data);

  if ((count ?? 0) > 0) redirect(`${PATTERN_PATH}/${id.data}?error=orders`);

  const [{ data: pattern }, { data: files }] = await Promise.all([
    service
      .from("patterns")
      .select("slug, cover_url, model_3d_url")
      .eq("id", id.data)
      .maybeSingle(),
    service.from("pattern_files").select("storage_path").eq("pattern_id", id.data),
  ]);

  const paths = (files ?? []).map((file) => file.storage_path as string);
  if (paths.length > 0) {
    const { error } = await service.storage.from("patterns").remove(paths);
    if (error) console.error("[admin/patterns] pdf remove", error);
  }

  const coverPath = publicBucketPath(pattern?.cover_url ?? null, "covers");
  if (coverPath) {
    const { error } = await service.storage.from("covers").remove([coverPath]);
    if (error) console.error("[admin/patterns] cover remove", error);
  }

  const modelPath = publicBucketPath(pattern?.model_3d_url ?? null, "models");
  if (modelPath) {
    const { error } = await service.storage.from("models").remove([modelPath]);
    if (error) console.error("[admin/patterns] model remove", error);
  }

  const { error } = await service.from("patterns").delete().eq("id", id.data);

  revalidatePath(PATTERN_PATH);
  revalidatePath("/catalog");
  revalidatePath("/");

  redirect(`${PATTERN_PATH}?${error ? "error=delete" : "deleted=1"}`);
}
