import { describe, expect, it } from "vitest";

import {
  getFeaturedPatterns,
  listCategoriesWithCounts,
  listPatternsByCategory,
  listPublishedPatterns,
} from "../lib/patterns";

describe("слой данных каталога", () => {
  it("отдаёт только опубликованные выкройки", async () => {
    const patterns = await listPublishedPatterns();

    expect(patterns.length).toBeGreaterThanOrEqual(6);
    expect(patterns.every((pattern) => pattern.status === "published")).toBe(true);
    expect(patterns.some((pattern) => pattern.slug === "dress-back")).toBe(false);
  });

  it("сортирует подборку по числу покупок и уважает лимит", async () => {
    const featured = await getFeaturedPatterns(3);

    expect(featured).toHaveLength(3);
    expect(featured.map((pattern) => pattern.salesCount)).toEqual(
      [...featured].map((pattern) => pattern.salesCount).sort((a, b) => b - a),
    );
  });

  it("считает категории без черновиков", async () => {
    const categories = await listCategoriesWithCounts();
    const total = categories.reduce((sum, category) => sum + category.patternCount, 0);
    const published = await listPublishedPatterns();

    expect(categories).toHaveLength(5);
    expect(total).toBe(published.length);
    expect(categories.every((category) => category.patternCount > 0)).toBe(true);
  });

  it("фильтрует по категории и без неё возвращает всё", async () => {
    const dresses = await listPatternsByCategory("dresses");
    const all = await listPatternsByCategory();

    expect(dresses).toHaveLength(2);
    expect(dresses.every((pattern) => pattern.categorySlug === "dresses")).toBe(true);
    expect(all.length).toBe((await listPublishedPatterns()).length);
  });

  it("у каждой выкройки три размера и положительная цена", async () => {
    const patterns = await listPublishedPatterns();

    for (const pattern of patterns) {
      expect(pattern.sizes.map((size) => size.label)).toEqual(["42", "46", "50"]);
      expect(pattern.price).toBeGreaterThan(0);
    }
  });
});
