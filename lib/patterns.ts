import { describeSupabaseError } from "@/lib/supabase/errors";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";

import {
  CATEGORY_DESCRIPTIONS,
  isCategorySlug,
  mapPatternRow,
  sortByPopularity,
  type CategorySlug,
  type CategoryWithCount,
  type Pattern,
  type PatternRow,
} from "./pattern-domain";

/**
 * Слой данных каталога (T-04): читает опубликованные выкройки и категории из
 * Supabase через публичный ключ. Видимость строк определяет RLS: гость видит
 * только `status = 'published'`, админ — всё.
 *
 * Доменные типы и чистые преобразования — в `lib/pattern-domain.ts`, чтобы их
 * можно было тестировать без БД.
 */

export * from "./pattern-domain";

/**
 * Вложенные связи PostgREST: категория, размеры и параметры одной выкройки.
 * Экспортируется, чтобы избранное (T-16) собирало карточки тем же маппером.
 */
export const PATTERN_SELECT = `
  id, slug, title, description, level, sewing_hours, fabric_note, materials, allowances,
  price, cover_url, model_3d_url, status, sales_count, created_at, published_at,
  category:categories!inner (slug),
  sizes:pattern_sizes (label, bust, waist, hips, height_min, height_max, fabric_consumption_m),
  params:pattern_params (code, title, values)
`;

/**
 * Ошибка чтения не должна валить сборку CI, где нет секретов Supabase: там
 * каталог собирается пустым. В остальных окружениях ошибка пробрасывается.
 */
function failRead<T>(context: string, error: unknown): T[] {
  const message = describeSupabaseError(error);

  if (process.env.CI) {
    console.warn(`[${context}] Supabase недоступен на сборке CI: ${message}`);
    return [];
  }

  throw new Error(`Не удалось загрузить ${context}: ${message}`);
}

async function fetchPublishedPatterns(): Promise<Pattern[]> {
  if (!hasSupabaseEnv()) {
    return failRead<Pattern>("каталог", "Supabase не настроен: проверьте .env.local");
  }

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("patterns")
      .select(PATTERN_SELECT)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) return failRead<Pattern>("каталог", error);

    return ((data ?? []) as unknown as PatternRow[]).map(mapPatternRow);
  } catch (error) {
    return failRead<Pattern>("каталог", error);
  }
}

/** Все опубликованные выкройки. Черновики не покидают слой данных (FR-8.2). */
export async function listPublishedPatterns(): Promise<Pattern[]> {
  return fetchPublishedPatterns();
}

/** Подборка для главной: по числу покупок, затем по новизне. */
export async function getFeaturedPatterns(limit = 6): Promise<Pattern[]> {
  return sortByPopularity(await fetchPublishedPatterns(), limit);
}

/** Категории со счётчиком опубликованных выкроек (FR-1.2). */
export async function listCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  if (!hasSupabaseEnv()) {
    return failRead<CategoryWithCount>("категории", "Supabase не настроен: проверьте .env.local");
  }

  try {
    const supabase = createPublicClient();
    const [categoriesResult, patternsResult] = await Promise.all([
      supabase.from("categories").select("id, slug, title").order("sort", { ascending: true }),
      supabase.from("patterns").select("category_id").eq("status", "published"),
    ]);

    if (categoriesResult.error) {
      return failRead<CategoryWithCount>("категории", categoriesResult.error);
    }
    if (patternsResult.error) {
      return failRead<CategoryWithCount>("категории", patternsResult.error);
    }

    const counts = new Map<string, number>();
    for (const row of patternsResult.data ?? []) {
      const categoryId = (row as { category_id: string }).category_id;
      counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
    }

    return ((categoriesResult.data ?? []) as { id: string; slug: string; title: string }[])
      .filter((row) => isCategorySlug(row.slug))
      .map((row) => {
        const slug = row.slug as CategorySlug;

        return {
          slug,
          title: row.title,
          description: CATEGORY_DESCRIPTIONS[slug],
          patternCount: counts.get(row.id) ?? 0,
        };
      });
  } catch (error) {
    return failRead<CategoryWithCount>("категории", error);
  }
}

/** Выкройки выбранной категории; без категории — весь опубликованный каталог. */
export async function listPatternsByCategory(slug?: CategorySlug): Promise<Pattern[]> {
  const patterns = await fetchPublishedPatterns();

  return slug ? patterns.filter((pattern) => pattern.categorySlug === slug) : patterns;
}

/**
 * Одна опубликованная выкройка по slug (T-13).
 *
 * Черновик и несуществующий slug неотличимы для клиента — оба дают `null`,
 * а страница показывает 404 (FR-8.2).
 */
export async function getPatternBySlug(slug: string): Promise<Pattern | null> {
  if (!hasSupabaseEnv()) {
    if (process.env.CI) {
      console.warn("[выкройка] Supabase не настроен на сборке CI");
      return null;
    }

    throw new Error("Supabase не настроен: проверьте .env.local");
  }

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("patterns")
      .select(PATTERN_SELECT)
      .eq("status", "published")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      if (process.env.CI) {
        console.warn(
          `[выкройка] Supabase недоступен на сборке CI: ${describeSupabaseError(error)}`,
        );
        return null;
      }

      throw new Error(`Не удалось загрузить выкройку: ${describeSupabaseError(error)}`);
    }

    return data ? mapPatternRow(data as unknown as PatternRow) : null;
  } catch (error) {
    if (process.env.CI) {
      console.warn(`[выкройка] Supabase недоступен на сборке CI: ${describeSupabaseError(error)}`);
      return null;
    }

    throw error instanceof Error ? error : new Error(describeSupabaseError(error));
  }
}
