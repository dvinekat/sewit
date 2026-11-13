import { totalAfterDiscount } from "./pricing";

/**
 * Промокоды (T-29, T-32, FR-5.2).
 *
 * Чистая проверка строки `promo_codes`: срок, лимит, активность. Скидка
 * считается в копейках и не превышает сумму заказа.
 */

export interface PromoCodeRow {
  code: string;
  percent: number;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  active: boolean;
}

export type PromoStatus = "valid" | "not_found" | "inactive" | "expired" | "exhausted";

export interface PromoEvaluation {
  status: PromoStatus;
  code: string | null;
  discount: number;
  total: number;
  message: string;
}

export function promoDiscount(subtotal: number, percent: number): number {
  if (!Number.isInteger(subtotal) || subtotal < 0) {
    throw new RangeError("Сумма должна быть целым неотрицательным числом копеек");
  }
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
    throw new RangeError("Процент скидки должен быть целым числом от 0 до 100");
  }

  return Math.min(subtotal, Math.floor((subtotal * percent) / 100));
}

export function evaluatePromo(
  row: PromoCodeRow | null,
  subtotal: number,
  now: Date = new Date(),
): PromoEvaluation {
  if (!row) {
    return {
      status: "not_found",
      code: null,
      discount: 0,
      total: subtotal,
      message: "Промокод не найден. Проверьте написание.",
    };
  }

  if (!row.active) {
    return {
      status: "inactive",
      code: row.code,
      discount: 0,
      total: subtotal,
      message: "Промокод выключен и больше не действует.",
    };
  }

  if (row.expires_at && new Date(row.expires_at).getTime() <= now.getTime()) {
    return {
      status: "expired",
      code: row.code,
      discount: 0,
      total: subtotal,
      message: "Срок действия промокода истёк.",
    };
  }

  if (row.used_count >= row.max_uses) {
    return {
      status: "exhausted",
      code: row.code,
      discount: 0,
      total: subtotal,
      message: "Лимит использований промокода исчерпан.",
    };
  }

  const discount = promoDiscount(subtotal, row.percent);

  return {
    status: "valid",
    code: row.code,
    discount,
    total: totalAfterDiscount(subtotal, discount),
    message: `Промокод ${row.code}: скидка ${row.percent}%.`,
  };
}
