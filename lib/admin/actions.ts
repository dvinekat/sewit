"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/guards";
import type { AdminActionState } from "@/lib/admin/form-state";
import { listPromoCodes } from "@/lib/admin/queries";
import {
  PROMO_FIELDS,
  promoCreateSchema,
  promoExpiresAt,
  promoUpdateSchema,
} from "@/lib/schemas/admin";
import { authFieldErrors } from "@/lib/schemas/auth";
import { describeSupabaseError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

/**
 * Экшены админки (T-42, FR-8.6).
 *
 * Каждый экшен заново проверяет роль: proxy и layout защищают интерфейс, но
 * server action можно вызвать напрямую. Запись идёт клиентом сессии — RLS
 * `promo_codes_admin_all` пропустит только администратора.
 */

const PROMO_PATH = "/admin/promo";

function promoPayload(values: {
  code: string;
  percent: number;
  maxUses: number;
  expiresAt: string | null;
  active: boolean;
}) {
  return {
    code: values.code,
    percent: values.percent,
    max_uses: values.maxUses,
    expires_at: promoExpiresAt(values.expiresAt),
    active: values.active,
  };
}

function valuesFrom(formData: FormData) {
  const values: Record<string, FormDataEntryValue> = {};

  for (const key of PROMO_FIELDS) {
    const value = formData.get(key);
    if (value !== null) values[key] = value;
  }

  return values;
}

function promoErrorMessage(error: { code?: string } | null): string {
  if (error?.code === "23505") return "Промокод с таким кодом уже существует.";
  if (error?.code === "23514") {
    return "Лимит не может быть меньше уже использованного числа раз.";
  }

  return `Не удалось сохранить промокод: ${describeSupabaseError(error)}`;
}

export async function createPromoAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = promoCreateSchema.safeParse(valuesFrom(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Проверьте поля промокода.",
      fieldErrors: authFieldErrors(parsed.error, PROMO_FIELDS),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("promo_codes").insert(promoPayload(parsed.data));

  if (error) {
    return { status: "error", message: promoErrorMessage(error) };
  }

  revalidatePath(PROMO_PATH);
  redirect(`${PROMO_PATH}?created=${encodeURIComponent(parsed.data.code)}`);
}

export async function updatePromoAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = promoUpdateSchema.safeParse({
    ...valuesFrom(formData),
    id: formData.get("id"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Проверьте поля промокода.",
      fieldErrors: authFieldErrors(parsed.error, PROMO_FIELDS),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("promo_codes")
    .update(promoPayload(parsed.data))
    .eq("id", parsed.data.id);

  if (error) {
    return { status: "error", message: promoErrorMessage(error) };
  }

  revalidatePath(PROMO_PATH);
  redirect(`${PROMO_PATH}?updated=${encodeURIComponent(parsed.data.code)}`);
}

const idSchema = z.string().uuid();

/** Включение и выключение промокода из списка (FR-8.6). */
export async function togglePromoAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = idSchema.safeParse(formData.get("id"));
  const next = formData.get("active") === "1";

  if (!id.success) redirect(`${PROMO_PATH}?error=id`);

  // Проверяем существование строки: RLS молча не обновит чужой промокод,
  // поэтому «нет ошибки» само по себе ещё не значит «получилось».
  const existing = (await listPromoCodes()).find((promo) => promo.id === id.data);

  if (!existing) redirect(`${PROMO_PATH}?error=missing`);

  const supabase = await createClient();
  const { error } = await supabase.from("promo_codes").update({ active: next }).eq("id", id.data);

  revalidatePath(PROMO_PATH);
  redirect(`${PROMO_PATH}?${error ? "error=toggle" : next ? "enabled=1" : "disabled=1"}`);
}

/** Удаление промокода: заказы хранят код строкой, поэтому история не ломается. */
export async function deletePromoAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = idSchema.safeParse(formData.get("id"));

  if (!id.success) redirect(`${PROMO_PATH}?error=id`);

  const supabase = await createClient();
  const { error } = await supabase.from("promo_codes").delete().eq("id", id.data);

  revalidatePath(PROMO_PATH);
  redirect(`${PROMO_PATH}?${error ? "error=delete" : "deleted=1"}`);
}
