import { z } from "zod";

/**
 * Схема категории каталога (T-40, FR-8.3).
 *
 * Slug — часть URL каталога (`/catalog?category=...`), поэтому только латиница,
 * цифры и дефис. `sort` управляет порядком в навигации витрины.
 */
export const categorySchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Slug: минимум 2 символа")
    .max(40, "Slug: максимум 40 символов")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: латиница, цифры и дефис, например dresses-kids"),
  title: z
    .string()
    .trim()
    .min(2, "Название: минимум 2 символа")
    .max(60, "Название: максимум 60 символов"),
  sort: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? 0 : Number(value)),
    z.number().int("Порядок: целое число").min(0, "Порядок: от 0").max(999, "Порядок: до 999"),
  ),
});

export const categoryUpdateSchema = categorySchema.extend({
  id: z.string().uuid("Некорректный идентификатор категории"),
});

export type CategoryValues = z.infer<typeof categorySchema>;

export const CATEGORY_FIELDS = ["slug", "title", "sort"] as const;
