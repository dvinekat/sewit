import { describe, expect, it } from "vitest";

import {
  catalogHref,
  hasActiveFilters,
  parseCatalogQuery,
  selectPatterns,
  sortPatterns,
  type CatalogQuery,
} from "../lib/catalog";
import { catalogPatterns } from "../lib/catalog-data";
import type { Pattern } from "../lib/pattern-domain";

const published = catalogPatterns.filter((pattern) => pattern.status === "published");
const base: CatalogQuery = { sort: "new" };

describe("разбор URL-состояния каталога", () => {
  it("по умолчанию отдаёт сортировку «сначала новые» и никаких фильтров", () => {
    expect(parseCatalogQuery({})).toEqual({ sort: "new" });
  });

  it("принимает корректные значения", () => {
    expect(
      parseCatalogQuery({
        category: "dresses",
        size: "46",
        level: "3",
        price: "1500-2000",
        sort: "price-asc",
        q: "  платье  ",
      }),
    ).toEqual({
      category: "dresses",
      size: "46",
      level: 3,
      price: "1500-2000",
      sort: "price-asc",
      q: "платье",
    });
  });

  it("игнорирует мусор и слишком короткий поиск", () => {
    expect(
      parseCatalogQuery({
        category: "shoes",
        size: "44",
        level: "9",
        price: "cheap",
        sort: "random",
        q: "п",
      }),
    ).toEqual({ sort: "new" });
  });

  it("берёт первое значение из массива", () => {
    expect(parseCatalogQuery({ category: ["skirts", "tops"], size: ["42", "46"] })).toEqual({
      category: "skirts",
      size: "42",
      sort: "new",
    });
  });
});

describe("ссылки каталога", () => {
  it("строит ссылку без мусорных параметров", () => {
    expect(catalogHref()).toBe("/catalog");
    expect(catalogHref({ category: "tops" })).toBe("/catalog?category=tops");
    expect(catalogHref({ sort: "new" })).toBe("/catalog");
  });

  it("сохраняет фильтры при смене категории", () => {
    expect(catalogHref({ category: "dresses", size: "46", sort: "price-asc", q: "платье" })).toBe(
      "/catalog?category=dresses&size=46&sort=price-asc&q=%D0%BF%D0%BB%D0%B0%D1%82%D1%8C%D0%B5",
    );
  });

  it("понимает, есть ли активные фильтры", () => {
    expect(hasActiveFilters({ sort: "new" })).toBe(false);
    expect(hasActiveFilters({ sort: "new", q: "худи" })).toBe(true);
    expect(hasActiveFilters({ sort: "new", size: "42" })).toBe(true);
  });
});

describe("фильтрация каталога", () => {
  it("фильтрует по категории", () => {
    const result = selectPatterns(published, { ...base, category: "dresses" });

    expect(result.map((pattern) => pattern.slug)).toEqual(["slip-dress", "dress-shirt"]);
  });

  it("фильтрует по сложности", () => {
    const result = selectPatterns(published, { ...base, level: 2 });

    expect(result.map((pattern) => pattern.slug).sort()).toEqual(["slip-dress", "top-puff"]);
  });

  it("фильтрует по диапазону цены в копейках", () => {
    const cheap = selectPatterns(published, { ...base, price: "up-to-1500" });
    const middle = selectPatterns(published, { ...base, price: "1500-2000" });
    const expensive = selectPatterns(published, { ...base, price: "from-2000" });

    expect(cheap.map((pattern) => pattern.price)).toEqual([129000, 149000]);
    expect(middle.map((pattern) => pattern.slug)).toEqual(["trousers-palazzo"]);
    expect(expensive.every((pattern) => pattern.price > 200_000)).toBe(true);
  });

  it("ищет по названию и описанию без учёта регистра", () => {
    expect(
      selectPatterns(published, { ...base, q: "ПЛАТЬЕ" })
        .map((p) => p.slug)
        .sort(),
    ).toEqual(["dress-shirt", "slip-dress"]);
    expect(selectPatterns(published, { ...base, q: "худи" }).map((p) => p.slug)).toEqual([
      "hoodie-oversize",
    ]);
  });

  it("учитывает размер выкройки", () => {
    const only42: Pattern = {
      ...published[0]!,
      sizes: published[0]!.sizes.filter((size) => size.label === "42"),
    };

    expect(selectPatterns([only42], { ...base, size: "42" })).toHaveLength(1);
    expect(selectPatterns([only42], { ...base, size: "46" })).toHaveLength(0);
  });

  it("комбинирует фильтры и возвращает пустой список, если ничего не подошло", () => {
    const result = selectPatterns(published, { ...base, category: "tops", q: "платье" });

    expect(result).toEqual([]);
  });
});

describe("сортировки каталога", () => {
  it("сортирует по цене в обе стороны", () => {
    expect(sortPatterns(published, "price-asc").map((pattern) => pattern.price)).toEqual([
      129000, 149000, 189000, 219000, 229000, 249000,
    ]);

    expect(sortPatterns(published, "price-desc").map((pattern) => pattern.price)).toEqual([
      249000, 229000, 219000, 189000, 149000, 129000,
    ]);
  });

  it("сортирует по новизне", () => {
    expect(sortPatterns(published, "new").map((pattern) => pattern.slug)).toEqual([
      "slip-dress",
      "hoodie-oversize",
      "trousers-palazzo",
      "dress-shirt",
      "top-puff",
      "skirt-slit",
    ]);
  });

  it("сортирует по популярности", () => {
    expect(sortPatterns(published, "popular").map((pattern) => pattern.slug)).toEqual([
      "dress-shirt",
      "hoodie-oversize",
      "skirt-slit",
      "trousers-palazzo",
      "top-puff",
      "slip-dress",
    ]);
  });
});
