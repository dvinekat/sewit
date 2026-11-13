import { describe, expect, it } from "vitest";

import { catalogPatterns } from "@/lib/catalog-data";
import { buildMeasurementsSnapshot } from "@/lib/orders/measurements-snapshot";

const dress = catalogPatterns.find((pattern) => pattern.slug === "dress-shirt")!;

describe("снапшот мерок", () => {
  it("считает рекомендацию на сервере по размерной сетке", () => {
    const snapshot = buildMeasurementsSnapshot(
      { bust: 96, waist: 78, hips: 104, height: 166 },
      dress.sizes,
      dress.categorySlug,
      new Date("2026-11-14T00:00:00Z"),
    );

    expect(snapshot?.recommended_size).toBe("48");
    expect(snapshot?.warnings).toBeInstanceOf(Array);
    expect(snapshot?.captured_at).toBe("2026-11-14T00:00:00.000Z");
  });

  it("без сохранённых мерок снапшота нет", () => {
    expect(buildMeasurementsSnapshot(null, dress.sizes, dress.categorySlug)).toBeNull();
  });

  it("в снапшот попадают предупреждения", () => {
    const snapshot = buildMeasurementsSnapshot(
      { bust: 88, waist: 70, hips: 96, height: 172 },
      dress.sizes,
      dress.categorySlug,
    );

    expect(snapshot?.warnings.some((warning) => warning.code === "height")).toBe(true);
  });
});
