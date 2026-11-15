import { promoExpiryInput } from "@/lib/schemas/admin";

/**
 * Значения формы промокода (T-42).
 *
 * Живут отдельно от клиентского компонента: серверная страница тоже собирает
 * начальные значения, а импортировать не-компонент из модуля `"use client"`
 * нельзя — React отдал бы ссылку на клиентский код.
 */
export interface PromoFormValues {
  id?: string;
  code: string;
  percent: string;
  maxUses: string;
  expiresAt: string;
  active: boolean;
}

export function promoFormValuesFrom(promo: {
  id: string;
  code: string;
  percent: number;
  maxUses: number;
  expiresAt: string | null;
  active: boolean;
}): PromoFormValues {
  return {
    id: promo.id,
    code: promo.code,
    percent: String(promo.percent),
    maxUses: String(promo.maxUses),
    expiresAt: promoExpiryInput(promo.expiresAt),
    active: promo.active,
  };
}

export const EMPTY_PROMO_FORM: PromoFormValues = {
  code: "",
  percent: "10",
  maxUses: "100",
  expiresAt: "",
  active: true,
};
