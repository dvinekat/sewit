import {
  isCategorySlug,
  type CategorySlug,
  type Pattern,
  type PatternLevel,
} from "./pattern-domain";

/**
 * URL-состояние каталога (FR-1.3, FR-1.4).
 *
 * Все фильтры живут в query-параметрах, поэтому комбинация переживает
 * перезагрузку и шарится ссылкой. Мусор в URL не ломает страницу:
 * неизвестное значение просто игнорируется.
 */

export const CATALOG_SIZES = ["42", "46", "50"] as const;
export type CatalogSize = (typeof CATALOG_SIZES)[number];

export const CATALOG_SORTS = ["new", "popular", "price-asc", "price-desc"] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

export const DEFAULT_SORT: CatalogSort = "new";

export const SORT_LABELS: Record<CatalogSort, string> = {
  new: "Сначала новые",
  popular: "По популярности",
  "price-asc": "Сначала дешёвые",
  "price-desc": "Сначала дорогие",
};

export const PRICE_RANGES = [
  { value: "up-to-1500", title: "до 1 500 ₽", min: 0, max: 150_000 },
  { value: "1500-2000", title: "1 500 – 2 000 ₽", min: 150_001, max: 200_000 },
  { value: "from-2000", title: "от 2 000 ₽", min: 200_001, max: Number.POSITIVE_INFINITY },
] as const;

export type PriceRangeValue = (typeof PRICE_RANGES)[number]["value"];

export interface CatalogQuery {
  category?: CategorySlug;
  size?: CatalogSize;
  level?: PatternLevel;
  price?: PriceRangeValue;
  sort: CatalogSort;
  /** Поиск по названию и описанию, минимум 2 символа (FR-1.5). */
  q?: string;
}

export type CatalogSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isCatalogSize(value: string): value is CatalogSize {
  return (CATALOG_SIZES as readonly string[]).includes(value);
}

function isPriceRange(value: string): value is PriceRangeValue {
  return PRICE_RANGES.some((range) => range.value === value);
}

function isCatalogSort(value: string): value is CatalogSort {
  return (CATALOG_SORTS as readonly string[]).includes(value);
}

function parseLevel(value: string): PatternLevel | undefined {
  const level = Number(value);
  return Number.isInteger(level) && level >= 1 && level <= 5 ? (level as PatternLevel) : undefined;
}

export function parseCatalogQuery(params: CatalogSearchParams): CatalogQuery {
  const category = first(params.category);
  const size = first(params.size);
  const level = first(params.level);
  const price = first(params.price);
  const sort = first(params.sort);
  const search = first(params.q)?.trim().slice(0, 100);

  return {
    category: category && isCategorySlug(category) ? category : undefined,
    size: size && isCatalogSize(size) ? size : undefined,
    level: level ? parseLevel(level) : undefined,
    price: price && isPriceRange(price) ? price : undefined,
    sort: sort && isCatalogSort(sort) ? sort : DEFAULT_SORT,
    q: search && search.length >= 2 ? search : undefined,
  };
}

/** Один источник формата ссылки каталога: категория и остальные фильтры. */
export function catalogHref(query: Partial<CatalogQuery> = {}): string {
  const params = new URLSearchParams();

  if (query.category) params.set("category", query.category);
  if (query.size) params.set("size", query.size);
  if (query.level) params.set("level", String(query.level));
  if (query.price) params.set("price", query.price);
  if (query.sort && query.sort !== DEFAULT_SORT) params.set("sort", query.sort);
  if (query.q) params.set("q", query.q);

  const search = params.toString();
  return search ? `/catalog?${search}` : "/catalog";
}

/** Есть ли хоть один фильтр — от этого зависит текст пустого состояния. */
export function hasActiveFilters(query: CatalogQuery): boolean {
  return Boolean(query.category || query.size || query.level || query.price || query.q);
}

export function sortPatterns(patterns: readonly Pattern[], sort: CatalogSort): Pattern[] {
  const sorted = [...patterns];

  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price || a.title.localeCompare(b.title, "ru"));
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price || a.title.localeCompare(b.title, "ru"));
    case "popular":
      return sorted.sort(
        (a, b) => b.salesCount - a.salesCount || b.createdAt.localeCompare(a.createdAt),
      );
    case "new":
    default:
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

/**
 * Фильтрация и сортировка на стороне приложения: в каталоге 6 моделей,
 * поэтому лишний запрос к БД на каждый фильтр не нужен. При росте каталога
 * фильтры уезжают в SQL.
 */
export function selectPatterns(patterns: readonly Pattern[], query: CatalogQuery): Pattern[] {
  const search = query.q?.toLocaleLowerCase("ru");
  const range = query.price ? PRICE_RANGES.find((item) => item.value === query.price) : undefined;

  const filtered = patterns.filter((pattern) => {
    if (query.category && pattern.categorySlug !== query.category) return false;
    if (query.size && !pattern.sizes.some((size) => size.label === query.size)) return false;
    if (query.level && pattern.level !== query.level) return false;
    if (range && (pattern.price < range.min || pattern.price > range.max)) return false;

    if (search) {
      const haystack = `${pattern.title} ${pattern.description}`.toLocaleLowerCase("ru");
      if (!haystack.includes(search)) return false;
    }

    return true;
  });

  return sortPatterns(filtered, query.sort);
}
