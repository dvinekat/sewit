/**
 * Чистые помощники формы выкройки в админке (T-39).
 *
 * Ни Next.js, ни Supabase: транслитерация slug, цена из рублей в копейки,
 * материалы из текста в массив и проверка готовности к публикации (FR-8.2).
 * Всё покрыто тестами, страница и экшен только вызывают эти функции.
 */

export type AdminPatternStatus = "draft" | "published";

/** Строка редактора таблицы размеров: значения как в полях ввода. */
export interface SizeRowInput {
  /** Локальный ключ строки для React; на сервер не уезжает. */
  key: string;
  label: string;
  bust: string;
  waist: string;
  hips: string;
  heightMin: string;
  heightMax: string;
  fabricConsumption: string;
  /** PDF уже лежит в Storage: подсказка в форме, на публикацию влияет через БД. */
  hasFile: boolean;
}

export interface ParamValueRowInput {
  value: string;
  title: string;
  available: boolean;
}

export interface ParamRowInput {
  code: string;
  title: string;
  values: ParamValueRowInput[];
}

export interface PublishSizeInput {
  label: string;
  hasFile: boolean;
}

export interface PublishInput {
  status: AdminPatternStatus;
  coverUrl: string;
  sizes: readonly PublishSizeInput[];
}

const TRANSLIT: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

/** «Платье-рубашка» → «plate-rubashka»: slug для URL карточки. */
export function slugify(input: string): string {
  const latin = Array.from(input.toLowerCase().trim())
    .map((char) => TRANSLIT[char] ?? char)
    .join("");

  return latin
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** «1 990,50» → 199050 копеек; null — если это не положительная цена. */
export function parsePriceRubles(input: string): number | null {
  const normalized = input.trim().replace(/\s+/g, "").replace(",", ".");
  if (!normalized) return null;

  const rubles = Number(normalized);
  if (!Number.isFinite(rubles) || rubles <= 0) return null;

  const kopecks = Math.round(rubles * 100);

  return kopecks > 0 && kopecks <= 100_000_000 ? kopecks : null;
}

/** Копейки → значение поля «Цена, ₽». */
export function priceRublesInput(kopecks: number): string {
  return String(kopecks / 100).replace(".", ",");
}

/** Материалы из textarea: по строке, запятой или точке с запятой; без дублей. */
export function parseMaterials(text: string): string[] {
  const items = text
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return [...new Set(items)].slice(0, 20);
}

/** Массив материалов → текст для textarea. */
export function materialsToText(materials: readonly string[]): string {
  return materials.join("\n");
}

/** Часы пошива из поля формы: принимает «3,5» и «3.5». */
export function parseSewingHours(input: string): number | null {
  const normalized = input.trim().replace(",", ".");
  if (!normalized) return null;

  const hours = Number(normalized);
  return Number.isFinite(hours) && hours >= 0.5 && hours <= 100 ? hours : null;
}

/**
 * Что мешает публикации (FR-8.2): без обложки, таблицы размеров и PDF
 * на каждый размер опубликовать выкройку нельзя. Черновик проходит всегда.
 */
export function publishBlockers({ status, coverUrl, sizes }: PublishInput): string[] {
  if (status !== "published") return [];

  const blockers: string[] = [];

  if (!coverUrl.trim()) {
    blockers.push("нет обложки: загрузите фото или укажите URL");
  }

  if (sizes.length === 0) {
    blockers.push("таблица размеров пуста");
  } else if (sizes.some((size) => !size.label.trim())) {
    blockers.push("у каждого размера должна быть подпись (42, 46, 48…)");
  }

  const missing = sizes
    .filter((size) => size.label.trim() && !size.hasFile)
    .map((size) => size.label);

  if (missing.length > 0) {
    blockers.push(`не загружен PDF для размеров: ${missing.join(", ")}`);
  }

  return blockers;
}
