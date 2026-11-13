"use server";

import { z } from "zod";

import { buildMeasurementsSnapshot } from "@/lib/orders/measurements-snapshot";
import type { CreateOrderResult, PromoActionResult } from "@/lib/orders/types";
import { cartItemKey, cartSubtotal, totalAfterDiscount } from "@/lib/pricing";
import { evaluatePromo, type PromoCodeRow } from "@/lib/promo";
import { PATTERN_SELECT, mapPatternRow, type Pattern, type PatternRow } from "@/lib/patterns";
import type { VariantSelection } from "@/lib/variant";
import { validateVariantSelection, variantTitle } from "@/lib/variant";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient, hasServiceRoleKey } from "@/lib/supabase/service";

const selectionSchema = z.record(z.string(), z.string().max(60));

const itemSchema = z.object({
  patternId: z.string().uuid(),
  sizeLabel: z.string().trim().min(1).max(10),
  selection: selectionSchema,
});

const createOrderSchema = z.object({
  items: z.array(itemSchema).min(1).max(20),
  promoCode: z.string().trim().max(40).optional(),
  idempotencyKey: z.string().min(8).max(100),
});

interface PromoDbRow extends PromoCodeRow {
  id: string;
}

function orderNumber(): string {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const random = Math.floor(Math.random() * 10_000)
    .toString()
    .padStart(4, "0");

  return `SW-${date}-${random}`;
}

function serverError(context: string, error: unknown): CreateOrderResult {
  console.error(`[order] ${context}`, error);
  return {
    status: "error",
    message: "Не удалось создать заказ. Попробуйте ещё раз.",
  };
}

/**
 * Создание оплаченного демо-заказа (T-30, T-31, T-21).
 *
 * Цены, размеры и доступность вариантов перечитываются из БД, а не берутся из
 * корзины. `idempotency_key` защищает от двойного клика; при сбое вставки
 * позиций или прав заказ удаляется каскадом (компенсация вместо транзакции).
 */
export async function createOrderAction(input: unknown): Promise<CreateOrderResult> {
  const parsed = createOrderSchema.safeParse(input);

  if (!parsed.success) {
    return { status: "error", message: "Некорректный состав заказа." };
  }

  if (!hasServiceRoleKey()) {
    return {
      status: "error",
      message:
        "Демо-оплата недоступна: администратор не добавил SUPABASE_SERVICE_ROLE_KEY в .env.local.",
    };
  }

  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return { status: "error", message: "Войдите, чтобы оформить заказ." };
  }

  const { items, promoCode, idempotencyKey } = parsed.data;
  const service = createServiceClient();

  // Повторный клик с тем же ключом возвращает уже созданный заказ.
  const { data: existing } = await service
    .from("orders")
    .select("id, number, total, discount, user_id")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle<{
      id: string;
      number: string;
      total: number;
      discount: number;
      user_id: string | null;
    }>();

  if (existing) {
    if (existing.user_id !== user.id) {
      return { status: "error", message: "Ключ заказа уже использован." };
    }

    return {
      status: "success",
      message: "Заказ уже создан.",
      orderId: existing.id,
      number: existing.number,
      total: existing.total,
      discount: existing.discount,
    };
  }

  const patternIds = [...new Set(items.map((item) => item.patternId))];
  const { data: patternRows, error: patternsError } = await service
    .from("patterns")
    .select(PATTERN_SELECT)
    .in("id", patternIds)
    .eq("status", "published");

  if (patternsError) return serverError("patterns", patternsError);

  let patterns: Pattern[];
  try {
    patterns = ((patternRows ?? []) as unknown as PatternRow[]).map(mapPatternRow);
  } catch (error) {
    return serverError("map patterns", error);
  }

  const patternById = new Map(patterns.map((pattern) => [pattern.id, pattern]));
  const priced: {
    pattern: Pattern;
    size: Pattern["sizes"][number];
    variantKey: string;
    variantTitle: string;
    price: number;
  }[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const pattern = patternById.get(item.patternId);

    if (!pattern) {
      return { status: "error", message: "Одна из выкроек больше недоступна." };
    }

    const size = pattern.sizes.find((candidate) => candidate.label === item.sizeLabel);
    if (!size) {
      return { status: "error", message: `Размер ${item.sizeLabel} недоступен.` };
    }

    const selection = item.selection as VariantSelection;
    const validation = validateVariantSelection(selection, pattern.params);
    if (!validation.ok) {
      return {
        status: "error",
        message: Object.values(validation.errors)[0] ?? "Проверьте параметры выкройки.",
      };
    }

    const key = cartItemKey(pattern.id, size.label, validation.normalized);
    if (seen.has(key)) {
      return { status: "error", message: "Одна из позиций добавлена дважды." };
    }
    seen.add(key);

    priced.push({
      pattern,
      size,
      variantKey: validation.normalized,
      variantTitle: variantTitle(selection, pattern.params),
      price: pattern.price,
    });
  }

  const subtotal = cartSubtotal(priced);

  let promoRow: PromoDbRow | null = null;
  const code = promoCode?.trim().toUpperCase() || null;

  if (code) {
    const { data, error } = await service
      .from("promo_codes")
      .select("id, code, percent, max_uses, used_count, expires_at, active")
      .eq("code", code)
      .maybeSingle<PromoDbRow>();

    if (error) return serverError("promo read", error);
    promoRow = data;
  }

  const promo = evaluatePromo(promoRow, subtotal);
  if (code && promo.status !== "valid") {
    return { status: "error", message: promo.message };
  }

  const discount = promo.status === "valid" ? promo.discount : 0;
  const total = totalAfterDiscount(subtotal, discount);

  const { data: measurementRow } = await service
    .from("measurements")
    .select("bust, waist, hips, height")
    .eq("user_id", user.id)
    .maybeSingle<{
      bust: number | string;
      waist: number | string;
      hips: number | string;
      height: number | string;
    }>();

  const snapshot = buildMeasurementsSnapshot(
    measurementRow
      ? {
          bust: Number(measurementRow.bust),
          waist: Number(measurementRow.waist),
          hips: Number(measurementRow.hips),
          height: Number(measurementRow.height),
        }
      : null,
    priced[0]!.pattern.sizes,
    priced[0]!.pattern.categorySlug,
  );

  const orderPayload = {
    user_id: user.id,
    subtotal,
    discount,
    total,
    promo_code: code,
    status: "paid" as const,
    measurements_snapshot: snapshot,
    idempotency_key: idempotencyKey,
  };

  let order: { id: string; number: string; total: number } | null = null;
  let orderError: unknown = null;

  for (let attempt = 0; attempt < 2 && !order; attempt++) {
    const result = await service
      .from("orders")
      .insert({ ...orderPayload, number: orderNumber() })
      .select("id, number, total")
      .single<{ id: string; number: string; total: number }>();

    if (!result.error) {
      order = result.data;
      break;
    }

    orderError = result.error;

    if (result.error.code === "23505") {
      // Параллельный запрос успел вставить заказ с нашим idempotency_key.
      const { data: raced } = await service
        .from("orders")
        .select("id, number, total, discount, user_id")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle<{
          id: string;
          number: string;
          total: number;
          discount: number;
          user_id: string | null;
        }>();

      if (raced && raced.user_id === user.id) {
        return {
          status: "success",
          message: "Заказ уже создан.",
          orderId: raced.id,
          number: raced.number,
          total: raced.total,
          discount: raced.discount,
        };
      }
    }
  }

  if (!order) return serverError("orders insert", orderError);

  const createdItems: {
    orderItemId: string;
    patternId: string;
    sizeLabel: string;
    variantKey: string;
  }[] = [];

  for (const item of priced) {
    const { data: orderItem, error } = await service
      .from("order_items")
      .insert({
        order_id: order.id,
        pattern_id: item.pattern.id,
        size_label: item.size.label,
        variant_key: item.variantKey,
        title: item.pattern.title,
        price: item.pattern.price,
      })
      .select("id")
      .single<{ id: string }>();

    if (error || !orderItem) {
      await service.from("orders").delete().eq("id", order.id);
      return serverError("order items insert", error);
    }

    createdItems.push({
      orderItemId: orderItem.id,
      patternId: item.pattern.id,
      sizeLabel: item.size.label,
      variantKey: item.variantKey,
    });
  }

  const { error: entitlementsError } = await service.from("entitlements").insert(
    createdItems.map((item) => ({
      user_id: user.id,
      pattern_id: item.patternId,
      order_item_id: item.orderItemId,
      size_label: item.sizeLabel,
      variant_key: item.variantKey,
    })),
  );

  if (entitlementsError) {
    await service.from("orders").delete().eq("id", order.id);
    return serverError("entitlements insert", entitlementsError);
  }

  if (promoRow) {
    const { error: promoError } = await service
      .from("promo_codes")
      .update({ used_count: promoRow.used_count + 1 })
      .eq("id", promoRow.id)
      .lt("used_count", promoRow.max_uses);

    if (promoError) console.error("[order] promo increment", promoError);
  }

  return {
    status: "success",
    message: "Демо-заказ оплачен.",
    orderId: order.id,
    number: order.number,
    total: order.total,
    discount,
  };
}

/** Проверка промокода для оформления (FR-5.2); читает закрытую таблицу сервером. */
export async function validatePromoAction(
  codeInput: unknown,
  subtotalInput: unknown,
): Promise<PromoActionResult> {
  const code = z.string().trim().min(1).max(40).safeParse(codeInput);
  const subtotal = z.number().int().min(0).max(100_000_000).safeParse(subtotalInput);

  if (!code.success || !subtotal.success) {
    return {
      status: "invalid",
      message: "Проверьте промокод.",
      discount: 0,
      total: subtotal.success ? subtotal.data : 0,
    };
  }

  if (!hasServiceRoleKey()) {
    return {
      status: "invalid",
      message:
        "Промокоды недоступны: администратор не добавил SUPABASE_SERVICE_ROLE_KEY в .env.local.",
      discount: 0,
      total: subtotal.data,
    };
  }

  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return {
      status: "invalid",
      message: "Войдите, чтобы применить промокод.",
      discount: 0,
      total: subtotal.data,
    };
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("promo_codes")
    .select("id, code, percent, max_uses, used_count, expires_at, active")
    .eq("code", code.data.toUpperCase())
    .maybeSingle<PromoDbRow>();

  if (error) {
    console.error("[promo] read", error);
    return {
      status: "invalid",
      message: "Не удалось проверить промокод. Попробуйте ещё раз.",
      discount: 0,
      total: subtotal.data,
    };
  }

  const evaluation = evaluatePromo(data, subtotal.data);

  return {
    status: evaluation.status === "valid" ? "valid" : "invalid",
    message: evaluation.message,
    code: evaluation.code ?? undefined,
    discount: evaluation.discount,
    total: evaluation.total,
  };
}
