import { describe, expect, it } from "vitest";

import { cartSubtotal, cartItemKey, totalAfterDiscount } from "@/lib/pricing";
import { evaluatePromo, promoDiscount, type PromoCodeRow } from "@/lib/promo";

const promo: PromoCodeRow = {
  code: "SEWIT10",
  percent: 10,
  max_uses: 100,
  used_count: 5,
  expires_at: "2027-01-01T00:00:00Z",
  active: true,
};

const now = new Date("2026-11-14T00:00:00Z");

describe("сумма корзины", () => {
  it("складывает цены в копейках", () => {
    expect(cartSubtotal([{ price: 249000 }, { price: 149000 }])).toBe(398000);
  });

  it("пустая корзина даёт ноль", () => {
    expect(cartSubtotal([])).toBe(0);
  });

  it("отклоняет дробные и отрицательные цены", () => {
    expect(() => cartSubtotal([{ price: -1 }])).toThrow(RangeError);
    expect(() => cartSubtotal([{ price: 10.5 }])).toThrow(RangeError);
  });

  it("скидка не больше суммы и не уводит итог в минус", () => {
    expect(totalAfterDiscount(1000, 1500)).toBe(0);
    expect(totalAfterDiscount(1000, 300)).toBe(700);
  });

  it("ключ позиции стабилен", () => {
    expect(cartItemKey("p1", "48", "midi+short")).toBe("p1:48:midi+short");
  });
});

describe("промокод: четыре состояния", () => {
  it("валидный даёт скидку и новый итог", () => {
    const result = evaluatePromo(promo, 249000, now);

    expect(result.status).toBe("valid");
    expect(result.discount).toBe(24900);
    expect(result.total).toBe(224100);
  });

  it("просроченный не применяется", () => {
    const result = evaluatePromo({ ...promo, expires_at: "2026-01-01T00:00:00Z" }, 249000, now);

    expect(result.status).toBe("expired");
    expect(result.discount).toBe(0);
    expect(result.total).toBe(249000);
  });

  it("исчерпанный лимит не применяется", () => {
    const result = evaluatePromo({ ...promo, used_count: 100 }, 249000, now);

    expect(result.status).toBe("exhausted");
    expect(result.discount).toBe(0);
  });

  it("выключенный не применяется", () => {
    const result = evaluatePromo({ ...promo, active: false }, 249000, now);

    expect(result.status).toBe("inactive");
  });

  it("неизвестный код даёт not_found", () => {
    const result = evaluatePromo(null, 249000, now);

    expect(result.status).toBe("not_found");
    expect(result.message).toContain("не найден");
  });
});

describe("округление скидки", () => {
  it("считает вниз до копейки", () => {
    expect(promoDiscount(100, 33)).toBe(33);
    expect(promoDiscount(999, 10)).toBe(99);
  });

  it("100% не больше суммы", () => {
    expect(promoDiscount(249000, 100)).toBe(249000);
  });

  it("отклоняет некорректный процент", () => {
    expect(() => promoDiscount(100, 101)).toThrow(RangeError);
    expect(() => promoDiscount(100, -1)).toThrow(RangeError);
  });
});
