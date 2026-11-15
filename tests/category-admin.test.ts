import { describe, expect, it } from "vitest";

import { categorySchema, categoryUpdateSchema } from "@/lib/schemas/category";

const valid = { slug: "dresses-kids", title: "Детские платья", sort: "5" };

describe("схема категории", () => {
  it("нормализует slug", () => {
    const parsed = categorySchema.parse({ ...valid, slug: "  Dresses-Kids " });
    expect(parsed.slug).toBe("dresses-kids");
  });

  it("не принимает кириллицу, пробелы и висячий дефис в slug", () => {
    expect(categorySchema.safeParse({ ...valid, slug: "детские" }).success).toBe(false);
    expect(categorySchema.safeParse({ ...valid, slug: "dresses kids" }).success).toBe(false);
    expect(categorySchema.safeParse({ ...valid, slug: "dresses-" }).success).toBe(false);
    expect(categorySchema.safeParse({ ...valid, slug: "d" }).success).toBe(false);
  });

  it("держит границы названия", () => {
    expect(categorySchema.safeParse({ ...valid, title: "Ю" }).success).toBe(false);
    expect(categorySchema.safeParse({ ...valid, title: "Ю".repeat(61) }).success).toBe(false);
    expect(categorySchema.safeParse({ ...valid, title: "Юбки" }).success).toBe(true);
  });

  it("превращает пустой порядок в 0 и держит границы", () => {
    expect(categorySchema.parse({ ...valid, sort: "" }).sort).toBe(0);
    expect(categorySchema.parse({ ...valid, sort: 0 }).sort).toBe(0);
    expect(categorySchema.parse({ ...valid, sort: "999" }).sort).toBe(999);
    expect(categorySchema.safeParse({ ...valid, sort: "-1" }).success).toBe(false);
    expect(categorySchema.safeParse({ ...valid, sort: "1000" }).success).toBe(false);
    expect(categorySchema.safeParse({ ...valid, sort: "2.5" }).success).toBe(false);
    expect(categorySchema.safeParse({ ...valid, sort: "много" }).success).toBe(false);
  });

  it("для обновления требует uuid", () => {
    expect(
      categoryUpdateSchema.safeParse({ ...valid, id: "10000000-0000-4000-8000-000000000001" })
        .success,
    ).toBe(true);
    expect(categoryUpdateSchema.safeParse({ ...valid, id: "dresses" }).success).toBe(false);
  });
});
