import { NextResponse } from "next/server";

import { createPersonalizedPdf } from "@/lib/pdf/title-page";
import type { MeasurementsSnapshot } from "@/lib/orders/measurements-snapshot";
import { parsePatternParamValues, type PatternParam } from "@/lib/pattern-domain";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient, hasServiceRoleKey } from "@/lib/supabase/service";
import {
  findVariantFile,
  parseVariantKey,
  variantTitle,
  type VariantSelection,
} from "@/lib/variant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(message: string, status: number) {
  return new NextResponse(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/**
 * Выдача PDF по entitlement (T-35, FR-7.1–7.3).
 *
 * Сессия → своя строка `entitlements` → файл по (size, variant) с фолбэком →
 * signed URL с TTL 10 минут → скачивание сервером → титульный лист (T-36) →
 * запись в download_log. Прямой URL без подписи и чужой entitlement недоступны.
 */
export async function GET(
  _request: Request,
  { params: routeParams }: { params: Promise<{ entitlementId: string }> },
) {
  const { entitlementId } = await routeParams;

  if (!UUID_PATTERN.test(entitlementId)) return text("Некорректная ссылка", 400);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return text("Войдите, чтобы скачать выкройку", 401);

  const { data: entitlement, error: entitlementError } = await supabase
    .from("entitlements")
    .select("id, user_id, pattern_id, size_label, variant_key, order_item_id, granted_at")
    .eq("id", entitlementId)
    .maybeSingle<{
      id: string;
      user_id: string;
      pattern_id: string;
      size_label: string;
      variant_key: string;
      order_item_id: string;
      granted_at: string;
    }>();

  if (entitlementError || !entitlement || entitlement.user_id !== user.id) {
    return text("Нет доступа к этому файлу", 403);
  }

  if (!hasServiceRoleKey()) return text("Выдача файлов не настроена", 503);

  const service = createServiceClient();

  const { data: pattern } = await service
    .from("patterns")
    .select("id, slug, title, params:pattern_params(code, title, values)")
    .eq("id", entitlement.pattern_id)
    .maybeSingle<{
      id: string;
      slug: string;
      title: string;
      params: { code: string; title: string; values: unknown }[] | null;
    }>();

  const { data: size } = await service
    .from("pattern_sizes")
    .select("id, label")
    .eq("pattern_id", entitlement.pattern_id)
    .eq("label", entitlement.size_label)
    .maybeSingle<{ id: string; label: string }>();

  if (!pattern || !size) return text("Выкройка или размер больше недоступны", 404);

  const patternParams: PatternParam[] = (pattern.params ?? []).map((param) => ({
    code: param.code as PatternParam["code"],
    title: param.title,
    values: parsePatternParamValues(param.values),
  }));
  const codes = patternParams.map((param) => param.code);
  const selection = (parseVariantKey(entitlement.variant_key, codes) ?? {}) as VariantSelection;

  const { data: fileRows } = await service
    .from("pattern_files")
    .select("id, variant_key, storage_path")
    .eq("pattern_id", entitlement.pattern_id)
    .eq("size_id", size.id);

  const match = findVariantFile(
    (fileRows ?? []).map((file) => ({
      sizeId: size.id,
      variantKey: file.variant_key,
      id: file.id,
      storagePath: file.storage_path,
    })),
    size.id,
    selection,
    codes,
  );

  if (!match.file) return text("Файл лекал ещё не загружен", 404);

  const ttl = Number(process.env.DOWNLOAD_URL_TTL_SECONDS ?? 600);
  const signed = await service.storage
    .from("patterns")
    .createSignedUrl(match.file.storagePath, Number.isFinite(ttl) ? ttl : 600);

  if (signed.error || !signed.data) {
    console.error("[download] sign", signed.error);
    return text("Не удалось подготовить файл. Попробуйте ещё раз.", 500);
  }

  const download = await fetch(signed.data.signedUrl, { cache: "no-store" });
  if (!download.ok) {
    console.error("[download] fetch", download.status);
    return text("Файл временно недоступен. Попробуйте ещё раз.", 502);
  }

  const source = new Uint8Array(await download.arrayBuffer());

  let orderInfo: {
    number: string;
    created_at: string;
    measurements_snapshot: MeasurementsSnapshot | null;
  } | null = null;

  if (entitlement.order_item_id) {
    const { data: orderItem } = await service
      .from("order_items")
      .select("order_id, order:orders!inner(number, created_at, measurements_snapshot)")
      .eq("id", entitlement.order_item_id)
      .maybeSingle<{
        order_id: string;
        order: {
          number: string;
          created_at: string;
          measurements_snapshot: MeasurementsSnapshot | null;
        } | null;
      }>();

    orderInfo = orderItem?.order ?? null;
  }

  const variantLabel =
    entitlement.variant_key === "none"
      ? "Базовый вариант"
      : (() => {
          const parsed = parseVariantKey(entitlement.variant_key, codes);
          return parsed ? variantTitle(parsed, patternParams) : entitlement.variant_key;
        })();

  let pdf: Uint8Array;
  try {
    pdf = await createPersonalizedPdf(source, {
      patternTitle: pattern.title,
      sizeLabel: size.label,
      variantLabel,
      orderNumber: orderInfo?.number ?? "—",
      purchasedAt: orderInfo?.created_at ?? entitlement.granted_at,
      measurements: orderInfo?.measurements_snapshot ?? null,
    });
  } catch (error) {
    console.error("[download] title page", error);
    return text("Не удалось подготовить титульный лист", 500);
  }

  const log = await service.from("download_log").insert({
    entitlement_id: entitlement.id,
    user_id: user.id,
    pattern_file_id: match.file.id,
  });

  if (log.error) console.error("[download] log", log.error);

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="sewit-${pattern.slug}-${size.label}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
