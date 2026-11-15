import { z } from "zod";

/**
 * Схемы админки (T-42): одна валидация на форму и на серверный экшен.
 *
 * Промокод нормализуется в верхний регистр: `sew10` и `SEW10` — один и тот же
 * код, иначе покупатель не поймёт, почему «не сработало».
 */

const CODE_PATTERN = /^[A-Z0-9_-]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** `2026-02-31` Date превращает в март, поэтому проверяем обратное преобразование. */
function isRealDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const promoCode = z
  .string()
  .trim()
  .toUpperCase()
  .min(3, "Код: минимум 3 символа")
  .max(40, "Код: максимум 40 символов")
  .regex(CODE_PATTERN, "Код: только латиница, цифры, дефис и подчёркивание");

const percent = z.coerce
  .number()
  .int("Процент: целое число")
  .min(1, "Процент: от 1")
  .max(100, "Процент: до 100");

const maxUses = z.coerce
  .number()
  .int("Лимит: целое число")
  .min(1, "Лимит: от 1")
  .max(100_000, "Лимит: до 100 000");

const expiresAt = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null))
  .refine((value) => value === null || isRealDate(value), {
    message: "Срок действия: дата в формате ГГГГ-ММ-ДД",
  });

const active = z.preprocess(
  (value) => value === "on" || value === "true" || value === true,
  z.boolean(),
);

export const promoCreateSchema = z.object({
  code: promoCode,
  percent,
  maxUses,
  expiresAt,
  active,
});

export const promoUpdateSchema = promoCreateSchema.extend({
  id: z.string().uuid("Некорректный идентификатор промокода"),
});

export type PromoCreateValues = z.infer<typeof promoCreateSchema>;
export type PromoUpdateValues = z.infer<typeof promoUpdateSchema>;

export const PROMO_FIELDS = ["code", "percent", "maxUses", "expiresAt", "active"] as const;

/** ISO-момент окончания действия: последняя секунда выбранного дня (UTC). */
export function promoExpiresAt(date: string | null): string | null {
  return date ? `${date}T23:59:59.000Z` : null;
}

/** Обратное преобразование для формы редактирования: ISO → `YYYY-MM-DD`. */
export function promoExpiryInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}
