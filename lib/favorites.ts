import { mapPatternRow, PATTERN_SELECT, type Pattern, type PatternRow } from "@/lib/patterns";
import { describeSupabaseError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

/**
 * Избранное пользователя (T-16, FR-6.4).
 *
 * Читается клиентом с cookie: RLS `favorites_select_own` сам отсекает чужие
 * строки, а `patterns!inner` скрывает черновики — в избранном видны только
 * опубликованные выкройки.
 */
export async function listFavoritePatterns(): Promise<Pattern[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("favorites")
    .select(`created_at, pattern:patterns!inner(${PATTERN_SELECT})`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Не удалось загрузить избранное: ${describeSupabaseError(error)}`);
  }

  const rows = (data ?? []) as unknown as { pattern: PatternRow | null }[];

  return rows.flatMap((row) => (row.pattern ? [mapPatternRow(row.pattern)] : []));
}

/** Счётчик избранного для обзора кабинета. Ошибку не превращаем в падение страницы. */
export async function countFavorites(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { count, error } = await supabase
    .from("favorites")
    .select("pattern_id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return error ? 0 : (count ?? 0);
}
