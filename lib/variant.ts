import type { ParamCode, PatternParam } from "./pattern-domain";

/**
 * Кастомизация через пресеты (T-23, T-25, README 6.2).
 *
 * `variant_key` — каноническая строка выбранных параметров: порядок фиксирован,
 * выключенный параметр — `none`, хвостовые `none` отбрасываются. Одна и та же
 * комбинация всегда даёт одну строку, поэтому по ней можно искать файл лекал.
 */

export const VARIANT_PARAM_ORDER: readonly ParamCode[] = ["length", "sleeve", "neckline", "fit"];

export const BASE_VARIANT_KEY = "none";

export type VariantSelection = Partial<Record<ParamCode, string>>;

export function orderedParamCodes(params: readonly PatternParam[]): ParamCode[] {
  const present = new Set(params.map((param) => param.code));

  return VARIANT_PARAM_ORDER.filter((code) => present.has(code));
}

function sortCodes(codes: readonly ParamCode[]): ParamCode[] {
  return [...codes].sort(
    (left, right) => VARIANT_PARAM_ORDER.indexOf(left) - VARIANT_PARAM_ORDER.indexOf(right),
  );
}

/** Стабильная строка варианта: `midi+short`, `midi+none+none+oversize`, `none`. */
export function normalizeVariantKey(
  selection: VariantSelection,
  codes: readonly ParamCode[],
): string {
  const ordered = sortCodes(codes);
  const parts = ordered.map((code) => selection[code]?.trim() || BASE_VARIANT_KEY);

  while (parts.length > 0 && parts[parts.length - 1] === BASE_VARIANT_KEY) {
    parts.pop();
  }

  return parts.length > 0 ? parts.join("+") : BASE_VARIANT_KEY;
}

/** Разбор строки обратно в выбор; `null` — строка не соответствует набору параметров. */
export function parseVariantKey(key: string, codes: readonly ParamCode[]): VariantSelection | null {
  const trimmed = key.trim();
  if (!trimmed) return null;

  if (trimmed === BASE_VARIANT_KEY) return {};

  const ordered = sortCodes(codes);
  const parts = trimmed.split("+");

  if (parts.length > ordered.length) return null;

  const selection: VariantSelection = {};

  for (let index = 0; index < parts.length; index++) {
    const value = parts[index]?.trim();
    const code = ordered[index];

    if (!value || !code) return null;
    if (value === BASE_VARIANT_KEY) continue;

    selection[code] = value;
  }

  // Отклоняем неканонические строки (`none+midi`, лишние none в конце).
  return normalizeVariantKey(selection, ordered) === trimmed ? selection : null;
}

export interface VariantValidation {
  ok: boolean;
  normalized: string;
  errors: Partial<Record<ParamCode, string>>;
}

/** Проверка выбора против параметров конкретной выкройки (FR-4.2). */
export function validateVariantSelection(
  selection: VariantSelection,
  params: readonly PatternParam[],
): VariantValidation {
  const errors: Partial<Record<ParamCode, string>> = {};
  const codes = orderedParamCodes(params);

  for (const code of Object.keys(selection) as ParamCode[]) {
    const value = selection[code];
    if (!value) continue;

    const param = params.find((item) => item.code === code);
    if (!param) {
      errors[code] = "Этот параметр недоступен для выкройки";
      continue;
    }

    const option = param.values.find((item) => item.value === value);
    if (!option) {
      errors[code] = "Такого варианта нет";
    } else if (!option.available) {
      errors[code] = "Вариант в разработке";
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    normalized: normalizeVariantKey(selection, codes),
    errors,
  };
}

/**
 * Цепочка поиска файла: точное совпадение → вариант с отключёнными
 * необязательными параметрами → базовый `none` (FR-4.3).
 */
export function variantCandidates(
  selection: VariantSelection,
  codes: readonly ParamCode[],
): string[] {
  const ordered = sortCodes(codes);
  const candidates = [normalizeVariantKey(selection, ordered)];
  const working: VariantSelection = { ...selection };

  // Отключаем выбранные параметры по одному с конца: так получаем промежуточные
  // варианты вроде `midi+short` → `midi` → `none`.
  for (const code of [...ordered].reverse()) {
    if (!working[code]) continue;

    delete working[code];
    const key = normalizeVariantKey(working, ordered);
    if (!candidates.includes(key)) candidates.push(key);
  }

  if (!candidates.includes(BASE_VARIANT_KEY)) candidates.push(BASE_VARIANT_KEY);

  return candidates;
}

export interface VariantFile {
  sizeId: string;
  variantKey: string;
}

export interface VariantFileMatch<T extends VariantFile> {
  file: T | null;
  requestedKey: string;
  resolvedKey: string | null;
  /** Файл найден точно по запрошенной комбинации. */
  isExact: boolean;
  /** Пришлось откатиться к более общему варианту или базовому файлу. */
  isFallback: boolean;
}

export function findVariantFile<T extends VariantFile>(
  files: readonly T[],
  sizeId: string,
  selection: VariantSelection,
  codes: readonly ParamCode[],
): VariantFileMatch<T> {
  const candidates = variantCandidates(selection, codes);

  for (const key of candidates) {
    const file = files.find((item) => item.sizeId === sizeId && item.variantKey === key);

    if (file) {
      return {
        file,
        requestedKey: candidates[0]!,
        resolvedKey: key,
        isExact: key === candidates[0],
        isFallback: key !== candidates[0],
      };
    }
  }

  return {
    file: null,
    requestedKey: candidates[0]!,
    resolvedKey: null,
    isExact: false,
    isFallback: false,
  };
}

/** Человекочитаемое название комбинации: «Midi · Короткий рукав». */
export function variantTitle(selection: VariantSelection, params: readonly PatternParam[]): string {
  const titles = orderedParamCodes(params).flatMap((code) => {
    const value = selection[code];
    if (!value) return [];

    const option = params
      .find((param) => param.code === code)
      ?.values.find((item) => item.value === value);

    return option ? [option.title] : [];
  });

  return titles.length > 0 ? titles.join(" · ") : "Базовый вариант";
}
