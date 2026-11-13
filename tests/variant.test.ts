import { describe, expect, it } from "vitest";

import type { PatternParam } from "@/lib/pattern-domain";
import {
  BASE_VARIANT_KEY,
  findVariantFile,
  normalizeVariantKey,
  orderedParamCodes,
  parseVariantKey,
  validateVariantSelection,
  variantCandidates,
  variantTitle,
} from "@/lib/variant";

const PARAMS: PatternParam[] = [
  {
    code: "length",
    title: "Длина",
    values: [
      { value: "midi", title: "Midi", available: true },
      { value: "maxi", title: "Maxi", available: true },
    ],
  },
  {
    code: "sleeve",
    title: "Рукав",
    values: [
      { value: "short", title: "Короткий", available: true },
      { value: "long", title: "Длинный", available: false },
    ],
  },
  {
    code: "fit",
    title: "Посадка",
    values: [{ value: "oversize", title: "Оверсайз", available: true }],
  },
];

const CODES = orderedParamCodes(PARAMS);

describe("нормализация variant_key", () => {
  it("не зависит от порядка выбора", () => {
    expect(normalizeVariantKey({ sleeve: "short", length: "midi" }, CODES)).toBe("midi+short");
    expect(normalizeVariantKey({ length: "midi", sleeve: "short" }, CODES)).toBe("midi+short");
  });

  it("сохраняет none в середине для поздних параметров", () => {
    expect(normalizeVariantKey({ fit: "oversize", length: "midi" }, CODES)).toBe(
      "midi+none+oversize",
    );
  });

  it("отбрасывает хвостовые none", () => {
    expect(normalizeVariantKey({ length: "midi" }, CODES)).toBe("midi");
  });

  it("пустой выбор — базовый none", () => {
    expect(normalizeVariantKey({}, CODES)).toBe(BASE_VARIANT_KEY);
  });
});

describe("разбор variant_key", () => {
  it("возвращает выбор для канонической строки", () => {
    expect(parseVariantKey("midi+short", CODES)).toEqual({ length: "midi", sleeve: "short" });
    expect(parseVariantKey("midi+none+oversize", CODES)).toEqual({
      length: "midi",
      fit: "oversize",
    });
    expect(parseVariantKey(BASE_VARIANT_KEY, CODES)).toEqual({});
  });

  it("разбирает значения позиционно, даже если они не входят в пресет", () => {
    expect(parseVariantKey("short+midi", CODES)).toEqual({ length: "short", sleeve: "midi" });
  });

  it("отклоняет неканонические и лишние значения", () => {
    expect(parseVariantKey("midi+none", CODES)).toBeNull();
    expect(parseVariantKey("midi+short+", CODES)).toBeNull();
    expect(parseVariantKey("midi+short+none", CODES)).toBeNull();
    expect(parseVariantKey("midi+sleeve+none+none+fit", CODES)).toBeNull();
    expect(parseVariantKey("", CODES)).toBeNull();
  });
});

describe("валидация выбора", () => {
  it("принимает доступную комбинацию", () => {
    const result = validateVariantSelection({ length: "midi", sleeve: "short" }, PARAMS);

    expect(result.ok).toBe(true);
    expect(result.normalized).toBe("midi+short");
    expect(result.errors).toEqual({});
  });

  it("помечает вариант в разработке", () => {
    const result = validateVariantSelection({ sleeve: "long" }, PARAMS);

    expect(result.ok).toBe(false);
    expect(result.errors.sleeve).toBe("Вариант в разработке");
  });

  it("отклоняет неизвестное значение и чужой параметр", () => {
    const result = validateVariantSelection({ length: "mini", neckline: "v" }, PARAMS);

    expect(result.ok).toBe(false);
    expect(result.errors.length).toBe("Такого варианта нет");
    expect(result.errors.neckline).toBe("Этот параметр недоступен для выкройки");
  });
});

describe("цепочка фолбэка файлов", () => {
  it("строит точный, промежуточный и базовый варианты", () => {
    expect(variantCandidates({ length: "midi", sleeve: "short" }, CODES)).toEqual([
      "midi+short",
      "midi",
      "none",
    ]);
  });

  it("находит точный файл", () => {
    const files = [
      { sizeId: "s46", variantKey: "midi+short" },
      { sizeId: "s46", variantKey: "none" },
    ];

    const match = findVariantFile(files, "s46", { length: "midi", sleeve: "short" }, CODES);

    expect(match.file?.variantKey).toBe("midi+short");
    expect(match.isExact).toBe(true);
    expect(match.isFallback).toBe(false);
  });

  it("откатывается к варианту без необязательного параметра", () => {
    const files = [
      { sizeId: "s46", variantKey: "midi" },
      { sizeId: "s46", variantKey: "none" },
    ];

    const match = findVariantFile(files, "s46", { length: "midi", sleeve: "short" }, CODES);

    expect(match.file?.variantKey).toBe("midi");
    expect(match.isExact).toBe(false);
    expect(match.isFallback).toBe(true);
  });

  it("откатывается к базовому файлу", () => {
    const files = [
      { sizeId: "s46", variantKey: "midi+long" },
      { sizeId: "s46", variantKey: "none" },
    ];

    const match = findVariantFile(files, "s46", { length: "midi", sleeve: "short" }, CODES);

    expect(match.file?.variantKey).toBe("none");
    expect(match.isFallback).toBe(true);
  });

  it("не берёт файл другого размера", () => {
    const files = [{ sizeId: "s50", variantKey: "midi+short" }];

    const match = findVariantFile(files, "s46", { length: "midi", sleeve: "short" }, CODES);

    expect(match.file).toBeNull();
    expect(match.resolvedKey).toBeNull();
  });
});

describe("название варианта", () => {
  it("собирает подписи в фиксированном порядке", () => {
    expect(variantTitle({ sleeve: "short", length: "midi" }, PARAMS)).toBe("Midi · Короткий");
  });

  it("без параметров показывает базовый вариант", () => {
    expect(variantTitle({}, PARAMS)).toBe("Базовый вариант");
  });
});
