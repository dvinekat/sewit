import { describe, expect, it } from "vitest";

import {
  parseMaterials,
  parsePriceRubles,
  parseSewingHours,
  priceRublesInput,
  publishBlockers,
  slugify,
} from "@/lib/admin/pattern-form";
import { patternCreateSchema, patternUpdateSchema } from "@/lib/schemas/pattern-admin";

const CATEGORY_ID = "10000000-0000-4000-8000-000000000001";

const sizeRow = (label = "42") => ({
  label,
  bust: 84,
  waist: 66,
  hips: 92,
  heightMin: 160,
  heightMax: 176,
  fabricConsumption: 1.8,
});

const validForm = {
  title: "Платье-рубашка",
  slug: "dress-shirt",
  description: "Платье-рубашка из льна с поясом — универсальная модель на каждый день.",
  categoryId: CATEGORY_ID,
  level: "2",
  sewingHours: "4,5",
  priceRubles: "2 990",
  fabricNote: "Лён шириной 140 см",
  materials: "Лён\nНитки\nПуговицы",
  allowances: "Припуск 1,5 см по всем срезам",
  status: "draft",
  coverUrl: "",
  sizes: JSON.stringify([sizeRow()]),
  params: JSON.stringify([
    { code: "length", title: "Длина", values: [{ value: "midi", title: "Миди", available: true }] },
  ]),
};

describe("slugify", () => {
  it("транслитерирует кириллицу", () => {
    expect(slugify("Платье-рубашка")).toBe("plate-rubashka");
    expect(slugify("Юбка с разрезом")).toBe("yubka-s-razrezom");
    expect(slugify("Худи оверсайз")).toBe("hudi-oversayz");
  });

  it("чистит лишние символы и приводит к нижнему регистру", () => {
    expect(slugify("  Платье «Миди»!  ")).toBe("plate-midi");
    expect(slugify("Топ  2 в 1")).toBe("top-2-v-1");
    expect(slugify("")).toBe("");
  });

  it("ограничивает длину 80 символами", () => {
    expect(slugify("а".repeat(200)).length).toBeLessThanOrEqual(80);
  });
});

describe("цена выкройки", () => {
  it("переводит рубли в копейки", () => {
    expect(parsePriceRubles("1990")).toBe(199000);
    expect(parsePriceRubles("1 990,50")).toBe(199050);
    expect(parsePriceRubles(" 2990 ")).toBe(299000);
  });

  it("отклоняет ноль, отрицательные и мусор", () => {
    expect(parsePriceRubles("0")).toBeNull();
    expect(parsePriceRubles("-100")).toBeNull();
    expect(parsePriceRubles("дорого")).toBeNull();
    expect(parsePriceRubles("")).toBeNull();
  });

  it("возвращает значение для поля ввода", () => {
    expect(priceRublesInput(199000)).toBe("1990");
    expect(priceRublesInput(199050)).toBe("1990,5");
  });
});

describe("материалы и время пошива", () => {
  it("делит материалы по строкам и запятым, убирает дубли", () => {
    expect(parseMaterials("Лён\nНитки, Пуговицы; Лён")).toEqual(["Лён", "Нитки", "Пуговицы"]);
    expect(parseMaterials("  \n , ")).toEqual([]);
    expect(
      parseMaterials(Array.from({ length: 30 }, (_, index) => `М${index}`).join("\n")),
    ).toHaveLength(20);
  });

  it("принимает часы с запятой и держит границы", () => {
    expect(parseSewingHours("3,5")).toBe(3.5);
    expect(parseSewingHours("0,5")).toBe(0.5);
    expect(parseSewingHours("0,4")).toBeNull();
    expect(parseSewingHours("101")).toBeNull();
    expect(parseSewingHours("много")).toBeNull();
  });
});

describe("готовность к публикации", () => {
  it("черновик проходит без проверок", () => {
    expect(
      publishBlockers({ status: "draft", coverUrl: "", sizes: [{ label: "42", hasFile: false }] }),
    ).toEqual([]);
  });

  it("называет всё, чего не хватает для публикации", () => {
    const blockers = publishBlockers({
      status: "published",
      coverUrl: "",
      sizes: [
        { label: "42", hasFile: true },
        { label: "46", hasFile: false },
      ],
    });

    expect(blockers).toHaveLength(2);
    expect(blockers[0]).toContain("обложки");
    expect(blockers[1]).toContain("46");
  });

  it("ловит пустую таблицу размеров", () => {
    const blockers = publishBlockers({
      status: "published",
      coverUrl: "https://example.com/cover.webp",
      sizes: [],
    });

    expect(blockers).toEqual(["таблица размеров пуста"]);
  });

  it("готовая выкройка публикуется без замечаний", () => {
    expect(
      publishBlockers({
        status: "published",
        coverUrl: "https://example.com/cover.webp",
        sizes: [{ label: "42", hasFile: true }],
      }),
    ).toEqual([]);
  });
});

describe("схема формы выкройки", () => {
  it("приводит поля к единицам БД", () => {
    const parsed = patternCreateSchema.parse(validForm);

    expect(parsed.priceRubles).toBe(299000);
    expect(parsed.sewingHours).toBe(4.5);
    expect(parsed.materials).toEqual(["Лён", "Нитки", "Пуговицы"]);
    expect(parsed.sizes).toHaveLength(1);
    expect(parsed.sizes[0]).toMatchObject({ label: "42", fabricConsumption: 1.8 });
    expect(parsed.params[0]).toMatchObject({ code: "length" });
    expect(parsed.coverUrl).toBeNull();
  });

  it("нормализует slug в нижний регистр", () => {
    const parsed = patternCreateSchema.parse({ ...validForm, slug: " Dress-Shirt " });
    expect(parsed.slug).toBe("dress-shirt");
  });

  it("отклоняет кривой slug и короткое описание", () => {
    expect(patternCreateSchema.safeParse({ ...validForm, slug: "платье" }).success).toBe(false);
    expect(patternCreateSchema.safeParse({ ...validForm, slug: "-dress" }).success).toBe(false);
    expect(patternCreateSchema.safeParse({ ...validForm, description: "Коротко" }).success).toBe(
      false,
    );
  });

  it("не принимает нулевую цену и пустые материалы", () => {
    expect(patternCreateSchema.safeParse({ ...validForm, priceRubles: "0" }).success).toBe(false);
    expect(patternCreateSchema.safeParse({ ...validForm, materials: " , " }).success).toBe(false);
  });

  it("ловит дубли размеров и перевёрнутый рост", () => {
    const duplicated = patternCreateSchema.safeParse({
      ...validForm,
      sizes: JSON.stringify([sizeRow("42"), sizeRow("42")]),
    });
    expect(duplicated.success).toBe(false);

    const badHeight = patternCreateSchema.safeParse({
      ...validForm,
      sizes: JSON.stringify([{ ...sizeRow(), heightMin: 180, heightMax: 170 }]),
    });
    expect(badHeight.success).toBe(false);
  });

  it("не падает на битом JSON в скрытых полях", () => {
    const parsed = patternCreateSchema.parse({ ...validForm, sizes: "{не json", params: "" });
    expect(parsed.sizes).toEqual([]);
    expect(parsed.params).toEqual([]);
  });

  it("проверяет URL обложки", () => {
    expect(
      patternCreateSchema.safeParse({ ...validForm, coverUrl: "ftp://example.com/a.jpg" }).success,
    ).toBe(false);
    expect(
      patternCreateSchema.parse({ ...validForm, coverUrl: "https://example.com/a.jpg" }).coverUrl,
    ).toBe("https://example.com/a.jpg");
  });

  it("для обновления требует uuid", () => {
    expect(
      patternUpdateSchema.safeParse({ ...validForm, id: "a0000000-0000-4000-8000-000000000001" })
        .success,
    ).toBe(true);
    expect(patternUpdateSchema.safeParse({ ...validForm, id: "not-uuid" }).success).toBe(false);
  });
});
