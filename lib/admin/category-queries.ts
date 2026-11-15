import { createClient } from "@/lib/supabase/server";

/**
 * Чтение категорий для админки (T-40, FR-8.3).
 *
 * Счётчики считаются по всем выкройкам, включая черновики: администратору важно
 * видеть, что категория занята, прежде чем её удалять.
 */

export interface AdminCategoryItem {
  id: string;
  slug: string;
  title: string;
  sort: number;
  /** Сколько выкроек в категории, включая черновики. */
  patternCount: number;
  publishedCount: number;
}

interface CategoryRow {
  id: string;
  slug: string;
  title: string;
  sort: number;
}

export async function listAdminCategoriesWithCounts(): Promise<AdminCategoryItem[]> {
  const supabase = await createClient();

  const [categories, patterns] = await Promise.all([
    supabase.from("categories").select("id, slug, title, sort").order("sort", { ascending: true }),
    supabase.from("patterns").select("category_id, status"),
  ]);

  if (categories.error || !categories.data) {
    console.error("[admin] categories", categories.error);
    return [];
  }

  if (patterns.error) console.error("[admin] categories patterns", patterns.error);

  const total = new Map<string, number>();
  const published = new Map<string, number>();

  for (const row of patterns.data ?? []) {
    const categoryId = row.category_id as string;
    total.set(categoryId, (total.get(categoryId) ?? 0) + 1);
    if (row.status === "published") published.set(categoryId, (published.get(categoryId) ?? 0) + 1);
  }

  return (categories.data as CategoryRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    sort: Number(row.sort),
    patternCount: total.get(row.id) ?? 0,
    publishedCount: published.get(row.id) ?? 0,
  }));
}

export async function getAdminCategory(id: string): Promise<AdminCategoryItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, title, sort")
    .eq("id", id)
    .maybeSingle<CategoryRow>();

  if (error || !data) return null;

  const { count: patternCount } = await supabase
    .from("patterns")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id);
  const { count: publishedCount } = await supabase
    .from("patterns")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id)
    .eq("status", "published");

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    sort: Number(data.sort),
    patternCount: patternCount ?? 0,
    publishedCount: publishedCount ?? 0,
  };
}
