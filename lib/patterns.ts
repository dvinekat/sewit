import { catalogCategories, catalogPatterns } from "./catalog-data";

/**
 * Доменный слой каталога.
 *
 * Данные скрыты за функциями `list*`/`get*`: сейчас используется локальный каталог
 * (`lib/catalog-data.ts`), при подключении БД меняются только тела функций —
 * сигнатуры, типы и компоненты страниц остаются прежними.
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

export function isCategorySlug(value: string): value is CategorySlug {
  return (CATEGORY_SLUGS as readonly string[]).includes(value);
}

function publishedPatterns(): Pattern[] {
  return catalogPatterns.filter((pattern) => pattern.status === "published");
}

/** Все опубликованные выкройки. Черновики не покидают слой данных (FR-8.2). */
export async function listPublishedPatterns(): Promise<Pattern[]> {
  return publishedPatterns();
}

/** Подборка для главной: по числу покупок, затем по новизне. */
export async function getFeaturedPatterns(limit = 6): Promise<Pattern[]> {
  return [...publishedPatterns()]
    .sort((a, b) => b.salesCount - a.salesCount || b.createdAt.localeCompare(a.createdAt))
    .slice(0, Math.max(0, limit));
}

/** Категории со счётчиком опубликованных выкроек (FR-1.2). */
export async function listCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const counts = new Map<CategorySlug, number>();
  for (const pattern of publishedPatterns()) {
    counts.set(pattern.categorySlug, (counts.get(pattern.categorySlug) ?? 0) + 1);
  }
  return catalogCategories.map((category) => ({
    ...category,
    patternCount: counts.get(category.slug) ?? 0,
  }));
}

/** Выкройки выбранной категории; без категории — весь опубликованный каталог. */
export async function listPatternsByCategory(slug?: CategorySlug): Promise<Pattern[]> {
  const patterns = publishedPatterns();
  return slug ? patterns.filter((pattern) => pattern.categorySlug === slug) : patterns;
}
