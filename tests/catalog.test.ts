import { describe, expect, it } from "vitest";

import type { Pattern } from "../lib/patterns";
import { catalogHref, filterPatternsByCategory, parseCategoryParam } from "../lib/catalog";

const sample = [
  { categorySlug: "dresses" },
  { categorySlug: "skirts" },
  { categorySlug: "dresses" },
] as Pattern[];

describe("URL-состояние каталога", () => {
  it("принимает известную категорию", () => {
    expect(parseCategoryParam("dresses")).toBe("dresses");
    expect(parseCategoryParam(["skirts", "dresses"])).toBe("skirts");
  });

  it("игнорирует пустое и неизвестное значение", () => {
    expect(parseCategoryParam(undefined)).toBeUndefined();
    expect(parseCategoryParam("")).toBeUndefined();
    expect(parseCategoryParam("shoes")).toBeUndefined();
    expect(parseCategoryParam(["", "dresses"])).toBeUndefined();
  });

  it("фильтрует выкройки по категории", () => {
    expect(filterPatternsByCategory(sample, "dresses")).toHaveLength(2);
    expect(filterPatternsByCategory(sample)).toHaveLength(3);
    expect(filterPatternsByCategory(sample, "tops")).toHaveLength(0);
  });

  it("собирает ссылку без битых параметров", () => {
    expect(catalogHref()).toBe("/catalog");
    expect(catalogHref("tops")).toBe("/catalog?category=tops");
  });
});
