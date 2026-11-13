/**
 * Доменный слой каталога: типы и чистые функции без доступа к БД и Next.js.
 *
 * Здесь нет `next/headers` и Supabase, поэтому модуль можно импортировать в тестах
 * и в клиентских компонентах. Запросы к БД — в `lib/patterns.ts`.
 */

export const CATEGORY_SLUGS = ["dresses", "skirts", "trousers", "tops", "outerwear"] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];
export type PatternLevel = 1 | 2 | 3 | 4 | 5;
export type PatternStatus = "draft" | "published";
export type ParamCode = "length" | "sleeve" | "neckline" | "fit";

export interface Category {
  slug: CategorySlug;
  title: string;
  description: string;
}

export interface CategoryWithCount extends Category {
  patternCount: number;
}

export interface PatternSize {
  label: string;
  bust: number;
  waist: number;
  hips: number;
  heightMin: number;
  heightMax: number;
  /** Расход ткани в метрах при ширине 140–145 см. */
  fabricConsumptionM: number;
}

export interface PatternParamValue {
  value: string;
  title: string;
  /** false — комбинация помечается «в разработке» (FR-4.2). */
  available: boolean;
}

export interface PatternParam {
  code: ParamCode;
  title: string;
  values: PatternParamValue[];
}

export interface Pattern {
  id: string;
  slug: string;
  title: string;
  description: string;
  categorySlug: CategorySlug;
  level: PatternLevel;
  sewingHours: number;
  fabricNote: string;
  materials: string[];
  allowances: string;
  /** Цена в копейках — как в orders (README 5). */
  price: number;
  /** Обложка из бакета `covers`; null — показываем иллюстрацию-заглушку. */
  coverUrl: string | null;
  /** .glb из бакета `models`; null — 3D недоступно (FR-10, P2). */
  model3dUrl: string | null;
  status: PatternStatus;
  salesCount: number;
  /** ISO-дата; для сортировки по новизне (T-10). */
  createdAt: string;
  publishedAt: string | null;
  sizes: PatternSize[];
  params: PatternParam[];
}

/** Подписи категорий: в БД (README 5) хранятся только slug и title. */
export const CATEGORY_DESCRIPTIONS: Record<CategorySlug, string> = {
  dresses: "От платья-рубашки до комбинации — на каждый день и для выхода.",
  skirts: "Прямые, расклешённые и с разрезом — база гардероба.",
  trousers: "Свободные палаццо и модели с посадкой по фигуре.",
  tops: "Лёгкие топы и блузы, которые шьются за вечер.",
  outerwear: "Худи и лёгкая верхняя одежда оверсайз.",
};

const PARAM_ORDER: ParamCode[] = ["length", "sleeve", "neckline", "fit"];

/** Строка `patterns` из PostgREST вместе с вложенными размерами и параметрами. */
export interface PatternRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: number | string;
  sewing_hours: number | string;
  fabric_note: string;
  materials: string[] | null;
  allowances: string;
  price: number | string;
  cover_url: string | null;
  model_3d_url: string | null;
  status: string;
  sales_count: number | string;
  created_at: string;
  published_at: string | null;
  category: { slug: string } | null;
  sizes: PatternSizeRow[];
  params: PatternParamRow[];
}

export interface PatternSizeRow {
  label: string;
  bust: number | string;
  waist: number | string;
  hips: number | string;
  height_min: number | string;
  height_max: number | string;
  fabric_consumption_m: number | string;
}

export interface PatternParamRow {
  code: string;
  title: string;
  /** jsonb-массив {value, title, available}. */
  values: unknown;
}

export function isCategorySlug(value: string): value is CategorySlug {
  return (CATEGORY_SLUGS as readonly string[]).includes(value);
}

function toNumber(value: number | string, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toLevel(value: number | string): PatternLevel {
  const level = Math.min(5, Math.max(1, Math.round(toNumber(value, 3))));
  return level as PatternLevel;
}

function parseParamValues(raw: unknown): PatternParamValue[] {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];

    const { value, title, available } = item as Record<string, unknown>;
    if (typeof value !== "string" || typeof title !== "string") return [];

    return [{ value, title, available: available !== false }];
  });
}

/**
 * Преобразует строку PostgREST в доменную модель (T-04).
 * @throws если у выкройки нет категории или она неизвестна — лучше упасть, чем
 * показать карточку с пустой категорией.
 */
export function mapPatternRow(row: PatternRow): Pattern {
  const categorySlug = row.category?.slug;

  if (!categorySlug || !isCategorySlug(categorySlug)) {
    throw new Error(`У выкройки «${row.slug}» неизвестная категория: ${categorySlug ?? "—"}`);
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    categorySlug,
    level: toLevel(row.level),
    sewingHours: toNumber(row.sewing_hours),
    fabricNote: row.fabric_note,
    materials: row.materials ?? [],
    allowances: row.allowances,
    price: toNumber(row.price),
    coverUrl: row.cover_url,
    model3dUrl: row.model_3d_url,
    status: row.status === "published" ? "published" : "draft",
    salesCount: toNumber(row.sales_count),
    createdAt: row.created_at,
    publishedAt: row.published_at,
    sizes: [...row.sizes]
      .sort((a, b) => toNumber(a.bust) - toNumber(b.bust))
      .map((size) => ({
        label: size.label,
        bust: toNumber(size.bust),
        waist: toNumber(size.waist),
        hips: toNumber(size.hips),
        heightMin: toNumber(size.height_min),
        heightMax: toNumber(size.height_max),
        fabricConsumptionM: toNumber(size.fabric_consumption_m),
      })),
    params: [...row.params]
      .sort((a, b) => {
        const left = PARAM_ORDER.indexOf(a.code as ParamCode);
        const right = PARAM_ORDER.indexOf(b.code as ParamCode);
        return (
          (left === -1 ? PARAM_ORDER.length : left) - (right === -1 ? PARAM_ORDER.length : right)
        );
      })
      .map((param) => ({
        code: param.code as ParamCode,
        title: param.title,
        values: parseParamValues(param.values),
      })),
  };
}

/** Подборка для главной: по числу покупок, затем по новизне (FR-1.4). */
export function sortByPopularity(patterns: readonly Pattern[], limit?: number): Pattern[] {
  const sorted = [...patterns].sort(
    (a, b) => b.salesCount - a.salesCount || b.createdAt.localeCompare(a.createdAt),
  );

  return limit === undefined ? sorted : sorted.slice(0, Math.max(0, limit));
}

/** Счётчик опубликованных выкроек по категориям (FR-1.2). */
export function countPatternsByCategory(patterns: readonly Pattern[]): Map<CategorySlug, number> {
  const counts = new Map<CategorySlug, number>();

  for (const pattern of patterns) {
    counts.set(pattern.categorySlug, (counts.get(pattern.categorySlug) ?? 0) + 1);
  }

  return counts;
}
