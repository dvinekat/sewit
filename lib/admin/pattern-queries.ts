import {
  materialsToText,
  priceRublesInput,
  type ParamRowInput,
  type SizeRowInput,
} from "@/lib/admin/pattern-form";
import { parsePatternParamValues } from "@/lib/pattern-domain";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient, hasServiceRoleKey } from "@/lib/supabase/service";

/**
 * Чтение выкроек для админки (T-39, FR-8.2).
 *
 * Сама выкройка, размеры и параметры читаются клиентом сессии под RLS.
 * `pattern_files` клиенту недоступна по политике (T-35), поэтому список
 * загруженных PDF берётся service_role-клиентом — только на сервере и только
 * после `requireAdmin` на странице.
 */

export interface AdminCategoryOption {
  id: string;
  slug: string;
  title: string;
}

export interface AdminPatternListItem {
  id: string;
  slug: string;
  title: string;
  status: string;
  price: number;
  coverUrl: string | null;
  salesCount: number;
  categoryTitle: string;
  sizesCount: number;
  filesCount: number;
  createdAt: string;
}

export interface AdminPatternDetails extends AdminPatternListItem {
  description: string;
  categoryId: string;
  level: number;
  sewingHours: number;
  fabricNote: string;
  materials: string[];
  allowances: string;
  sizes: SizeRowInput[];
  params: ParamRowInput[];
  /** Сколько размеров уже с PDF: для подсказки и проверки публикации. */
  sizesWithFiles: number;
}

export interface AdminPatternFilter {
  status: "all" | "draft" | "published";
  q: string | null;
}

interface PatternRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  price: number;
  sales_count: number;
  cover_url: string | null;
  created_at: string;
  category: { title: string } | null;
  sizes: { id: string }[] | null;
}

const PATTERN_LIST_SELECT = `
  id, slug, title, status, price, sales_count, cover_url, created_at,
  category:categories (title),
  sizes:pattern_sizes (id)
`;

export async function listAdminCategories(): Promise<AdminCategoryOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, title")
    .order("sort", { ascending: true });

  if (error || !data) {
    console.error("[admin] categories", error);
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
  }));
}

async function filesPerPattern(): Promise<Map<string, number>> {
  if (!hasServiceRoleKey()) return new Map();

  const service = createServiceClient();
  const { data, error } = await service.from("pattern_files").select("pattern_id");

  if (error || !data) {
    console.error("[admin] pattern files", error);
    return new Map();
  }

  const counts = new Map<string, number>();
  for (const row of data) {
    const patternId = row.pattern_id as string;
    counts.set(patternId, (counts.get(patternId) ?? 0) + 1);
  }

  return counts;
}

function mapListItem(row: PatternRow, filesCount: number): AdminPatternListItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    price: Number(row.price),
    coverUrl: row.cover_url,
    salesCount: Number(row.sales_count),
    categoryTitle: row.category?.title ?? "—",
    sizesCount: row.sizes?.length ?? 0,
    filesCount,
    createdAt: row.created_at,
  };
}

/** Все выкройки, включая черновики (FR-8.2): админ видит их по RLS. */
export async function listAdminPatterns(
  filter: AdminPatternFilter,
): Promise<AdminPatternListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("patterns")
    .select(PATTERN_LIST_SELECT)
    .order("created_at", { ascending: false });

  if (filter.status !== "all") query = query.eq("status", filter.status);
  if (filter.q) query = query.ilike("title", `%${filter.q}%`);

  const { data, error } = await query;

  if (error || !data) {
    console.error("[admin] patterns list", error);
    return [];
  }

  const files = await filesPerPattern();

  return (data as unknown as PatternRow[]).map((row) => mapListItem(row, files.get(row.id) ?? 0));
}

interface PatternDetailsRow extends PatternRow {
  description: string;
  level: number;
  sewing_hours: number;
  fabric_note: string;
  materials: string[] | null;
  allowances: string;
  category_id: string;
  sizes: {
    id: string;
    label: string;
    bust: number;
    waist: number;
    hips: number;
    height_min: number;
    height_max: number;
    fabric_consumption_m: number;
  }[];
  params: { code: string; title: string; values: unknown }[];
}

export async function getAdminPattern(id: string): Promise<AdminPatternDetails | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patterns")
    .select(
      `id, slug, title, description, category_id, level, sewing_hours, fabric_note, materials,
       allowances, price, cover_url, status, sales_count, created_at, category:categories (title),
       sizes:pattern_sizes (id, label, bust, waist, hips, height_min, height_max, fabric_consumption_m),
       params:pattern_params (code, title, values)`,
    )
    .eq("id", id)
    .maybeSingle<PatternDetailsRow>();

  if (error || !data) return null;

  const filesBySize = new Map<string, number>();

  if (hasServiceRoleKey()) {
    const service = createServiceClient();
    const { data: files } = await service
      .from("pattern_files")
      .select("size_id")
      .eq("pattern_id", id);

    for (const file of files ?? []) {
      const sizeId = file.size_id as string;
      filesBySize.set(sizeId, (filesBySize.get(sizeId) ?? 0) + 1);
    }
  }

  const sizes: SizeRowInput[] = [...data.sizes]
    .sort((a, b) => Number(a.bust) - Number(b.bust))
    .map((size) => ({
      key: size.id,
      label: size.label,
      bust: String(size.bust),
      waist: String(size.waist),
      hips: String(size.hips),
      heightMin: String(size.height_min),
      heightMax: String(size.height_max),
      fabricConsumption: String(size.fabric_consumption_m),
      hasFile: (filesBySize.get(size.id) ?? 0) > 0,
    }));

  const params: ParamRowInput[] = [...data.params].map((param) => ({
    code: param.code,
    title: param.title,
    values: parsePatternParamValues(param.values).map((value) => ({
      value: value.value,
      title: value.title,
      available: value.available,
    })),
  }));

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    status: data.status,
    price: Number(data.price),
    coverUrl: data.cover_url,
    salesCount: Number(data.sales_count),
    categoryTitle: data.category?.title ?? "—",
    createdAt: data.created_at,
    description: data.description,
    categoryId: data.category_id,
    level: Number(data.level),
    sewingHours: Number(data.sewing_hours),
    fabricNote: data.fabric_note,
    materials: data.materials ?? [],
    allowances: data.allowances,
    sizes,
    params,
    sizesWithFiles: sizes.filter((size) => size.hasFile).length,
    sizesCount: sizes.length,
    filesCount: sizes.reduce((sum, size) => sum + (filesBySize.get(size.key) ?? 0), 0),
  };
}

/** Значения формы новой выкройки: категория по умолчанию — первая из списка. */
export function emptyPatternFormValues(categoryId: string) {
  return {
    title: "",
    slug: "",
    description: "",
    categoryId,
    level: "3",
    sewingHours: "3",
    priceRubles: "",
    fabricNote: "",
    materials: "",
    allowances: "",
    status: "draft" as const,
    coverUrl: "",
    sizes: [] as SizeRowInput[],
    params: [] as ParamRowInput[],
  };
}

/** Значения формы из строки БД: строковые поля и строки размеров. */
export function patternFormValues(pattern: AdminPatternDetails) {
  return {
    id: pattern.id,
    title: pattern.title,
    slug: pattern.slug,
    description: pattern.description,
    categoryId: pattern.categoryId,
    level: String(pattern.level),
    sewingHours: String(pattern.sewingHours),
    priceRubles: priceRublesInput(pattern.price),
    fabricNote: pattern.fabricNote,
    materials: materialsToText(pattern.materials),
    allowances: pattern.allowances,
    status: pattern.status === "published" ? ("published" as const) : ("draft" as const),
    coverUrl: pattern.coverUrl ?? "",
    sizes: pattern.sizes,
    params: pattern.params,
  };
}
