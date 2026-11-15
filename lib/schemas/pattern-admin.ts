import { z } from "zod";

import { parseMaterials, parsePriceRubles, parseSewingHours } from "@/lib/admin/pattern-form";

/**
 * Схема формы выкройки в админке (T-39, FR-8.2).
 *
 * Таблица размеров и параметры приходят скрытыми полями с JSON: строк может
 * быть произвольно много, а фиксированные имена полей навязали бы лимит.
 * Все числа приводятся к нужным единицам здесь, в БД уходят уже проверенными.
 */

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SIZE_LABEL_PATTERN = /^[A-Za-zА-Яа-яЁё0-9-]{1,10}$/;

const PARAM_CODES = ["length", "sleeve", "neckline", "fit"] as const;

function decimal(min: number, max: number, label: string) {
  return z.coerce.number().min(min, `${label}: от ${min}`).max(max, `${label}: до ${max}`);
}

const sizeSchema = z
  .object({
    label: z
      .string()
      .trim()
      .regex(SIZE_LABEL_PATTERN, "Размер: 1–10 символов, буквы, цифры или дефис"),
    bust: decimal(50, 200, "ОГ"),
    waist: decimal(40, 200, "ОТ"),
    hips: decimal(50, 200, "ОБ"),
    heightMin: z.coerce
      .number()
      .int("Рост от: целое число")
      .min(120, "Рост от: от 120 см")
      .max(220, "Рост от: до 220 см"),
    heightMax: z.coerce
      .number()
      .int("Рост до: целое число")
      .min(121, "Рост до: от 121 см")
      .max(230, "Рост до: до 230 см"),
    fabricConsumption: decimal(0.1, 10, "Расход ткани"),
  })
  .refine((size) => size.heightMin < size.heightMax, {
    message: "Рост «от» должен быть меньше роста «до»",
    path: ["heightMax"],
  });

export const sizesSchema = z
  .array(sizeSchema)
  .max(20, "Не больше 20 размеров на выкройку")
  .superRefine((sizes, ctx) => {
    const seen = new Set<string>();

    for (const [index, size] of sizes.entries()) {
      const key = size.label.toLowerCase();

      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          message: `Размер «${size.label}» указан дважды`,
          path: [index, "label"],
        });
      }

      seen.add(key);
    }
  });

export const paramsSchema = z
  .array(
    z.object({
      code: z.enum(PARAM_CODES, { message: "Неизвестный код параметра" }),
      title: z.string().trim().min(1, "Название параметра: обязательно").max(40),
      values: z
        .array(
          z.object({
            value: z.string().trim().min(1, "Значение: обязательно").max(40),
            title: z.string().trim().min(1, "Подпись значения: обязательна").max(60),
            available: z.boolean(),
          }),
        )
        .min(1, "У параметра должно быть хотя бы одно значение")
        .max(8, "Не больше 8 значений на параметр"),
    }),
  )
  .max(4, "Не больше четырёх параметров")
  .superRefine((params, ctx) => {
    const seen = new Set<string>();

    for (const [index, param] of params.entries()) {
      if (seen.has(param.code)) {
        ctx.addIssue({
          code: "custom",
          message: `Параметр «${param.code}» указан дважды`,
          path: [index, "code"],
        });
      }

      seen.add(param.code);
    }
  });

/** JSON из скрытого поля: некорректный ввод превращается в пустой список. */
function jsonArrayField<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((value) => {
    if (typeof value !== "string" || value.trim() === "") return [];

    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, schema);
}

export const patternFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Название: минимум 2 символа")
    .max(120, "Название: максимум 120 символов"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Slug: минимум 2 символа")
    .max(80, "Slug: максимум 80 символов")
    .regex(SLUG_PATTERN, "Slug: латиница, цифры и дефис, например slip-dress"),
  description: z
    .string()
    .trim()
    .min(20, "Описание: минимум 20 символов")
    .max(4000, "Описание: максимум 4000 символов"),
  categoryId: z.string().uuid("Выберите категорию"),
  level: z.preprocess(
    (value) => Number(value),
    z
      .number()
      .int("Сложность: целое число 1–5")
      .min(1, "Сложность: от 1")
      .max(5, "Сложность: до 5"),
  ),
  sewingHours: z.string().transform((value, ctx) => {
    const hours = parseSewingHours(value);

    if (hours === null) {
      ctx.addIssue({ code: "custom", message: "Время пошива: от 0,5 до 100 часов" });
      return 1;
    }

    return hours;
  }),
  priceRubles: z.string().transform((value, ctx) => {
    const kopecks = parsePriceRubles(value);

    if (kopecks === null) {
      ctx.addIssue({ code: "custom", message: "Цена: положительное число рублей" });
      return 0;
    }

    return kopecks;
  }),
  fabricNote: z
    .string()
    .trim()
    .min(3, "Ткань: минимум 3 символа")
    .max(500, "Ткань: максимум 500 символов"),
  materials: z
    .string()
    .trim()
    .max(1200, "Материалы: максимум 1200 символов")
    .transform((value) => parseMaterials(value))
    .refine((materials) => materials.length > 0, {
      message: "Добавьте хотя бы один материал",
    }),
  allowances: z
    .string()
    .trim()
    .min(3, "Припуски: минимум 3 символа")
    .max(500, "Припуски: максимум 500 символов"),
  status: z.enum(["draft", "published"]),
  coverUrl: z
    .string()
    .trim()
    .max(500, "URL обложки: максимум 500 символов")
    .refine((value) => value === "" || /^https?:\/\/\S+$/.test(value), {
      message: "URL обложки: начинается с http(s)://",
    })
    .transform((value) => value || null),
  sizes: jsonArrayField(sizesSchema),
  params: jsonArrayField(paramsSchema),
});

export const patternCreateSchema = patternFormSchema;
export const patternUpdateSchema = patternFormSchema.extend({
  id: z.string().uuid("Некорректный идентификатор выкройки"),
});

export type PatternFormValues = z.infer<typeof patternFormSchema>;
export type PatternUpdateValues = z.infer<typeof patternUpdateSchema>;

export const PATTERN_FORM_FIELDS = [
  "title",
  "slug",
  "description",
  "categoryId",
  "level",
  "sewingHours",
  "priceRubles",
  "fabricNote",
  "materials",
  "allowances",
  "status",
  "coverUrl",
  "sizes",
  "params",
] as const;
