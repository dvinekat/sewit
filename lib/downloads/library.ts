import { parsePatternParamValues, type PatternParam } from "@/lib/pattern-domain";
import { createClient } from "@/lib/supabase/server";
import {
  orderedParamCodes,
  parseVariantKey,
  variantTitle,
  type VariantSelection,
} from "@/lib/variant";

/**
 * Библиотека «Мои выкройки» (T-34, FR-6.3).
 *
 * Источник прав — `entitlements`; RLS отдаёт только свои строки. Для подписи
 * варианта подтягиваем параметры выкройки и переводим `variant_key` в названия.
 */

export interface LibraryItem {
  entitlementId: string;
  patternId: string;
  slug: string;
  title: string;
  sizeLabel: string;
  variantKey: string;
  variantLabel: string;
  grantedAt: string;
}

interface ParamsRow {
  code: string;
  title: string;
  values: unknown;
}

interface LibraryRow {
  id: string;
  pattern_id: string;
  size_label: string;
  variant_key: string;
  granted_at: string;
  pattern: {
    slug: string;
    title: string;
    params: ParamsRow[];
  } | null;
}

function toParams(rows: ParamsRow[]): PatternParam[] {
  return rows.map((row) => ({
    code: row.code as PatternParam["code"],
    title: row.title,
    values: parsePatternParamValues(row.values),
  }));
}

export async function listMyLibrary(): Promise<LibraryItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("entitlements")
    .select(
      "id, pattern_id, size_label, variant_key, granted_at, pattern:patterns!inner(slug, title, params:pattern_params(code, title, values))",
    )
    .order("granted_at", { ascending: false });

  if (error || !data) return [];

  return (data as unknown as LibraryRow[]).flatMap((row) => {
    if (!row.pattern) return [];

    const params = toParams(row.pattern.params ?? []);
    const codes = orderedParamCodes(params);
    const selection = parseVariantKey(row.variant_key, codes) as VariantSelection | null;
    const label =
      row.variant_key === "none"
        ? "Базовый вариант"
        : selection
          ? variantTitle(selection, params)
          : row.variant_key;

    return [
      {
        entitlementId: row.id,
        patternId: row.pattern_id,
        slug: row.pattern.slug,
        title: row.pattern.title,
        sizeLabel: row.size_label,
        variantKey: row.variant_key,
        variantLabel: label,
        grantedAt: row.granted_at,
      },
    ];
  });
}
