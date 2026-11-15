"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/guards";
import type { AdminActionState } from "@/lib/admin/form-state";
import { CATEGORY_FIELDS, categorySchema, categoryUpdateSchema } from "@/lib/schemas/category";
import { authFieldErrors } from "@/lib/schemas/auth";
import { describeSupabaseError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

/**
 * CRUD категорий (T-40, FR-8.3).
 *
 * Записи идут клиентом сессии: RLS `categories_admin_write` пропускает только
 * администратора. Удаление запрещено, пока в категории есть выкройки —
 * `patterns.category_id` объявлен `on delete restrict`, но мы проверяем это
 * заранее, чтобы показать понятную причину вместо ошибки Postgres.
 */

const CATEGORY_PATH = "/admin/categories";

function valuesFrom(formData: FormData): Record<string, FormDataEntryValue> {
  const values: Record<string, FormDataEntryValue> = {};

  for (const key of CATEGORY_FIELDS) {
    const value = formData.get(key);
    if (value !== null) values[key] = value;
  }

  return values;
}

function categoryError(error: { code?: string } | null): string {
  if (error?.code === "23505") return "Категория с таким slug уже существует.";
  return `Не удалось сохранить категорию: ${describeSupabaseError(error)}`;
}

function revalidateCatalog() {
  revalidatePath(CATEGORY_PATH);
  revalidatePath("/admin/patterns");
  revalidatePath("/patterns/[slug]", "page");
  revalidatePath("/catalog");
  revalidatePath("/");
}

export async function createCategoryAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = categorySchema.safeParse(valuesFrom(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Проверьте поля категории.",
      fieldErrors: authFieldErrors(parsed.error, CATEGORY_FIELDS),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert(parsed.data);

  if (error) return { status: "error", message: categoryError(error) };

  revalidateCatalog();
  redirect(`${CATEGORY_PATH}?created=${encodeURIComponent(parsed.data.slug)}`);
}

export async function updateCategoryAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = categoryUpdateSchema.safeParse({
    ...valuesFrom(formData),
    id: formData.get("id"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Проверьте поля категории.",
      fieldErrors: authFieldErrors(parsed.error, CATEGORY_FIELDS),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ slug: parsed.data.slug, title: parsed.data.title, sort: parsed.data.sort })
    .eq("id", parsed.data.id);

  if (error) return { status: "error", message: categoryError(error) };

  revalidateCatalog();
  redirect(`${CATEGORY_PATH}/${parsed.data.id}?saved=1`);
}

const idSchema = z.string().uuid();

/** Удаление категории: только пустой — иначе выкройки останутся без категории. */
export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = idSchema.safeParse(formData.get("id"));

  if (!id.success) redirect(`${CATEGORY_PATH}?error=id`);

  const supabase = await createClient();
  const { count } = await supabase
    .from("patterns")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id.data);

  if ((count ?? 0) > 0) {
    redirect(`${CATEGORY_PATH}/${id.data}?error=patterns`);
  }

  const { error } = await supabase.from("categories").delete().eq("id", id.data);

  revalidateCatalog();
  redirect(`${CATEGORY_PATH}?${error ? "error=delete" : "deleted=1"}`);
}
