import { describe, expect, it } from "vitest";

import { catalogPatterns } from "../lib/catalog-data";
import {
  countPatternsByCategory,
  mapPatternRow,
  sortByPopularity,
  type PatternRow,
} from "../lib/pattern-domain";

const row: PatternRow = {
  id: "p-1",
  slug: "dress-shirt",
  title: "Платье-рубашка",
  description: "Свободное платье с отложным воротником.",
  level: "3",
  sewing_hours: "6",
  fabric_note: "Плотный хлопок или лён.",
  materials: ["2,5 м ткани", "6 пуговиц"],
  allowances: "1 см по срезам.",
  price: "249000",
  cover_url: null,
  model_3d_url: null,
  status: "published",
  sales_count: "128",
  created_at: "2026-10-02T00:00:00+00:00",
  published_at: "2026-10-05T00:00:00+00:00",
  category: { slug: "dresses" },
  sizes: [
    {
      label: "50",
      bust: "100",
      waist: "82",
      hips: 108,
      height_min: "162",
      height_max: 172,
      fabric_consumption_m: "2.80",
    },
    {
      label: "42",
      bust: 84,
      waist: 66,
      hips: 92,
      height_min: 158,
      height_max: 168,
      fabric_consumption_m: 2.2,
    },
  ],
  params: [
    {
      code: "sleeve",
      title: "Рукав",
      values: [{ value: "short", title: "Короткий", available: true }],
    },
    {
      code: "length",
      title: "Длина",
      values: [
        { value: "midi", title: "Midi", available: false },
        { value: "maxi", title: "Maxi" },
      ],
    },
  ],
};

describe("маппинг строки PostgREST", () => {
  it("переводит snake_case в доменную модель и приводит числа", () => {
    const pattern = mapPatternRow(row);

    expect(pattern.categorySlug).toBe("dresses");
    expect(pattern.level).toBe(3);
    expect(pattern.sewingHours).toBe(6);
    expect(pattern.price).toBe(249000);
    expect(pattern.salesCount).toBe(128);
    expect(pattern.materials).toHaveLength(2);
    expect(pattern.status).toBe("published");
  });

  it("сортирует размеры по обхвату груди и параметры по фиксированному порядку", () => {
    const pattern = mapPatternRow(row);

    expect(pattern.sizes.map((size) => size.label)).toEqual(["42", "50"]);
    expect(pattern.sizes[0]?.fabricConsumptionM).toBe(2.2);
    expect(pattern.params.map((param) => param.code)).toEqual(["length", "sleeve"]);
  });

  it("сохраняет флаг «в разработке» и по умолчанию считает значение доступным", () => {
    const pattern = mapPatternRow(row);
    const length = pattern.params.find((param) => param.code === "length");

    expect(length?.values.find((value) => value.value === "midi")?.available).toBe(false);
    expect(length?.values.find((value) => value.value === "maxi")?.available).toBe(true);
  });

  it("принимает категорию, созданную в админке, и падает без категории", () => {
    expect(mapPatternRow({ ...row, category: { slug: "dresses-kids" } }).categorySlug).toBe(
      "dresses-kids",
    );
    expect(() => mapPatternRow({ ...row, category: null })).toThrow(/категори/i);
  });
});

describe("подборка для главной", () => {
  it("сортирует по числу покупок и ограничивает количество", () => {
    const featured = sortByPopularity(catalogPatterns, 3);

    expect(featured.map((pattern) => pattern.slug)).toEqual([
      "dress-shirt",
      "hoodie-oversize",
      "skirt-slit",
    ]);
  });

  it("не мутирует исходный массив", () => {
    const original = catalogPatterns.map((pattern) => pattern.slug);
    sortByPopularity(catalogPatterns, 2);

    expect(catalogPatterns.map((pattern) => pattern.slug)).toEqual(original);
  });
});

describe("счётчики категорий", () => {
  it("считает выкройки по категориям", () => {
    const published = catalogPatterns.filter((pattern) => pattern.status === "published");
    const counts = countPatternsByCategory(published);

    expect(counts.get("dresses")).toBe(2);
    expect(counts.get("skirts")).toBe(1);
    expect(counts.get("outerwear")).toBe(1);
  });

  it("не считает черновики, если их отфильтровали", () => {
    const counts = countPatternsByCategory(catalogPatterns);

    expect(counts.get("dresses")).toBe(3);
  });
});
