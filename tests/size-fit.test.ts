import { describe, expect, it } from "vitest";

import { catalogPatterns } from "../lib/catalog-data";
import { measurementsSchema } from "../lib/schemas/measurements";
import { fitSize, garmentTypeForCategory, sizeDistance, type Measurements } from "../lib/size-fit";

const dress = catalogPatterns.find((pattern) => pattern.slug === "dress-shirt")!;
const sizes = dress.sizes;

const demo: Measurements = { bust: 88, waist: 70, hips: 96, height: 168 };
const size46 = sizes.find((size) => size.label === "46")!;

describe("формула расстояния", () => {
  it("точное совпадение мерок даёт ноль", () => {
    const size = sizes.find((item) => item.label === "44")!;
    const exact = { bust: size.bust, waist: size.waist, hips: size.hips, height: size.heightMin };

    expect(sizeDistance(exact, size)).toBeCloseTo(0, 10);
  });

  it("считает по весам 0,4 / 0,3 / 0,3", () => {
    // 88/70/96 против 92/74/100: 0,4·4/92 + 0,3·4/74 + 0,3·4/100.
    expect(sizeDistance(demo, size46)).toBeCloseTo(0.0456, 4);
  });
});

describe("рекомендация размера", () => {
  it("88/70/96/168 — новый размер 44, ближайшие 46 и 42", () => {
    const result = fitSize(demo, sizes, "shoulder");

    expect(result.recommended.label).toBe("44");
    expect(result.alternatives.map((size) => size.label)).toEqual(["46", "42"]);
  });

  it("мерки между 42 и 44 дают пограничный размер", () => {
    const result = fitSize({ bust: 86, waist: 68, hips: 94, height: 164 }, sizes, "shoulder");

    expect(result.recommended.label).toBe("44");
    expect(result.warnings.map((warning) => warning.code)).toContain("borderline");
  });

  it("мерки 96/78/104 попадают в новый размер 48", () => {
    const result = fitSize({ bust: 96, waist: 78, hips: 104, height: 166 }, sizes, "shoulder");

    expect(result.recommended.label).toBe("48");
  });

  it("точное попадание в 50 не считается пограничным", () => {
    const result = fitSize({ bust: 100, waist: 82, hips: 108, height: 167 }, sizes, "shoulder");

    expect(result.recommended.label).toBe("50");
    expect(result.warnings.some((warning) => warning.code === "borderline")).toBe(false);
  });

  it("отклонение роста больше 4 см даёт предупреждение", () => {
    const result = fitSize({ ...demo, height: 170 }, sizes, "shoulder");

    expect(result.warnings.some((warning) => warning.code === "height")).toBe(true);
  });

  it("отклонение роста ровно 4 см предупреждения не даёт", () => {
    const result = fitSize({ ...demo, height: 168 }, sizes, "shoulder");

    expect(result.warnings.some((warning) => warning.code === "height")).toBe(false);
  });

  it("расхождение мерок на два размера даёт предупреждение о подгонке", () => {
    const result = fitSize({ bust: 84, waist: 82, hips: 108, height: 165 }, sizes, "waist");

    expect(result.warnings.some((warning) => warning.code === "spread")).toBe(true);
  });

  it("определяет доминирующую мерку по типу изделия", () => {
    expect(garmentTypeForCategory("dresses")).toBe("shoulder");
    expect(garmentTypeForCategory("tops")).toBe("shoulder");
    expect(garmentTypeForCategory("skirts")).toBe("waist");
    expect(garmentTypeForCategory("trousers")).toBe("waist");

    expect(fitSize(demo, sizes, "shoulder").dominantMeasure).toBe("bust");
    expect(fitSize(demo, sizes, "waist").dominantMeasure).toBe("hips");
  });
});

describe("валидация мерок", () => {
  it("принимает строки из формы и приводит к числам", () => {
    const parsed = measurementsSchema.safeParse({
      bust: "88",
      waist: "70",
      hips: "96,5",
      height: "168",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.hips).toBe(96.5);
      expect(typeof parsed.data.bust).toBe("number");
    }
  });

  it("отклоняет мерки вне диапазонов", () => {
    const parsed = measurementsSchema.safeParse({
      bust: "20",
      waist: "300",
      hips: "",
      height: "168",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const paths = parsed.error.issues.map((issue) => issue.path[0]);
      expect(paths).toContain("bust");
      expect(paths).toContain("waist");
      expect(paths).toContain("hips");
    }
  });
});
