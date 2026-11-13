import { describe, expect, it } from "vitest";

import {
  formatPatternCount,
  formatPrice,
  formatSewingHours,
  getLevelLabel,
  pluralizeRu,
} from "../lib/format";

/** Intl на разных платформах использует разные пробелы; сравниваем нормализованно. */
function normalize(value: string): string {
  return value.replace(/[\s\u00a0\u202f]/g, " ");
}

describe("formatPrice", () => {
  it("переводит копейки в рубли", () => {
    expect(normalize(formatPrice(249000))).toBe("2 490 ₽");
    expect(normalize(formatPrice(0))).toBe("0 ₽");
  });

  it("отклоняет отрицательную цену", () => {
    expect(() => formatPrice(-1)).toThrow(RangeError);
  });
});

describe("склонения и подписи", () => {
  it("склоняет часы", () => {
    expect(formatSewingHours(1)).toBe("1 час");
    expect(formatSewingHours(3)).toBe("3 часа");
    expect(formatSewingHours(5)).toBe("5 часов");
    expect(formatSewingHours(11)).toBe("11 часов");
    expect(formatSewingHours(21)).toBe("21 час");
  });

  it("склоняет выкройки", () => {
    expect(formatPatternCount(1)).toBe("1 выкройка");
    expect(formatPatternCount(2)).toBe("2 выкройки");
    expect(formatPatternCount(6)).toBe("6 выкроек");
  });

  it("склоняет через pluralizeRu", () => {
    expect(pluralizeRu(2, "размер", "размера", "размеров")).toBe("размера");
    expect(pluralizeRu(14, "размер", "размера", "размеров")).toBe("размеров");
  });

  it("переводит уровень сложности 1–5", () => {
    expect([1, 2, 3, 4, 5].map(getLevelLabel)).toEqual([
      "Низкая",
      "Ниже среднего",
      "Средняя",
      "Выше среднего",
      "Высокая",
    ]);
    expect(getLevelLabel(0)).toBe("Не указан");
  });
});
