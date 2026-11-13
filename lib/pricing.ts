/**
 * Деньги в корзине и заказе (T-29, T-32).
 *
 * Все суммы — целые копейки. Скидка никогда не больше суммы и не уходит
 * в отрицательный итог; округление — вниз до копейки.
 */

export interface PricedItem {
  price: number;
}

export function cartSubtotal(items: readonly PricedItem[]): number {
  return items.reduce((sum, item) => {
    if (!Number.isInteger(item.price) || item.price < 0) {
      throw new RangeError("Цена позиции должна быть целым неотрицательным числом копеек");
    }

    return sum + item.price;
  }, 0);
}

/** Применяет скидку к сумме: не больше суммы, не меньше нуля. */
export function totalAfterDiscount(subtotal: number, discount: number): number {
  if (!Number.isInteger(subtotal) || subtotal < 0) {
    throw new RangeError("Сумма должна быть целым неотрицательным числом копеек");
  }
  if (!Number.isInteger(discount) || discount < 0) {
    throw new RangeError("Скидка должна быть целым неотрицательным числом копеек");
  }

  return Math.max(0, subtotal - Math.min(subtotal, discount));
}

/** Ключ позиции: одна выкройка + размер + нормализованный вариант. */
export function cartItemKey(patternId: string, sizeLabel: string, variantKey: string): string {
  return `${patternId}:${sizeLabel}:${variantKey}`;
}
