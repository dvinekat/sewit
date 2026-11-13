import type { ParamCode } from "@/lib/pattern-domain";

/** Контракты экшенов заказа (T-29–T-31); модуль экшенов экспортирует только функции. */

export interface CheckoutItemInput {
  patternId: string;
  sizeLabel: string;
  selection: Partial<Record<ParamCode, string>>;
}

export interface CreateOrderInput {
  items: CheckoutItemInput[];
  promoCode?: string;
  idempotencyKey: string;
}

export interface CreateOrderResult {
  status: "success" | "error";
  message: string;
  orderId?: string;
  number?: string;
  total?: number;
  discount?: number;
}

export interface PromoActionResult {
  status: "valid" | "invalid";
  message: string;
  code?: string;
  discount: number;
  total: number;
}
