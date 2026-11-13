import { isCategorySlug, type CategorySlug } from "./patterns";

/**
 * Разбор URL-состояния каталога (FR-1.3).
 * Мусор в query не ломает страницу: неизвестная категория трактуется как «все».
 */
export function parseCategoryParam(value: string | string[] | undefined): CategorySlug | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  return isCategorySlug(raw) ? raw : undefined;
}

export function filterPatternsByCategory<T extends { categorySlug: CategorySlug }>(
  patterns: readonly T[],
  slug?: CategorySlug,
): T[] {
  return slug ? patterns.filter((pattern) => pattern.categorySlug === slug) : [...patterns];
}

/** Ссылка на каталог с сохранением категории — один источник URL-формата. */
export function catalogHref(slug?: CategorySlug): string {
  return slug ? `/catalog?category=${slug}` : "/catalog";
}
