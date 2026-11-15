import type { CategorySlug, PatternSize } from "@/lib/pattern-domain";
import type { MeasurementsValues } from "@/lib/schemas/measurements";
import { fitSize, garmentTypeForCategory } from "@/lib/size-fit";

/**
 * Снапшот мерок для заказа (T-21, FR-3.3).
 *
 * Считается на сервере из сохранённых мерок и размерной сетки выкройки:
 * клиент не может подменить рекомендацию или предупреждения в истории заказа.
 */
export interface MeasurementsSnapshot extends MeasurementsValues {
  recommended_size: string;
  alternatives: string[];
  warnings: { code: string; title: string; message: string }[];
  captured_at: string;
}

export function buildMeasurementsSnapshot(
  measurements: MeasurementsValues | null,
  sizes: readonly PatternSize[],
  categorySlug: CategorySlug,
  capturedAt: Date = new Date(),
): MeasurementsSnapshot | null {
  if (!measurements || sizes.length === 0) return null;

  const fit = fitSize(measurements, sizes, garmentTypeForCategory(categorySlug));

  return {
    ...measurements,
    recommended_size: fit.recommended.label,
    alternatives: fit.alternatives.map((size) => size.label),
    warnings: fit.warnings.map((warning) => ({
      code: warning.code,
      title: warning.title,
      message: warning.message,
    })),
    captured_at: capturedAt.toISOString(),
  };
}

/**
 * Чтение снапшота из jsonb (админская карточка заказа, T-41).
 *
 * Схема jsonb не типизирована на уровне БД, поэтому мусор в колонке не должен
 * ронять страницу: неизвестные поля отбрасываются, обязательные мерки
 * проверяются как числа.
 */
export function parseMeasurementsSnapshot(raw: unknown): MeasurementsSnapshot | null {
  if (typeof raw !== "object" || raw === null) return null;

  const source = raw as Record<string, unknown>;
  const toNumber = (value: unknown): number | null => {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const bust = toNumber(source.bust);
  const waist = toNumber(source.waist);
  const hips = toNumber(source.hips);
  const height = toNumber(source.height);

  if (bust === null || waist === null || hips === null || height === null) return null;

  return {
    bust,
    waist,
    hips,
    height,
    recommended_size: typeof source.recommended_size === "string" ? source.recommended_size : "",
    alternatives: Array.isArray(source.alternatives)
      ? source.alternatives.filter((item): item is string => typeof item === "string")
      : [],
    warnings: Array.isArray(source.warnings)
      ? source.warnings.flatMap((item) => {
          if (typeof item !== "object" || item === null) return [];

          const warning = item as Record<string, unknown>;
          const title = typeof warning.title === "string" ? warning.title : "";
          const message = typeof warning.message === "string" ? warning.message : "";
          const code = typeof warning.code === "string" ? warning.code : "warning";

          return title || message ? [{ code, title, message }] : [];
        })
      : [],
    captured_at: typeof source.captured_at === "string" ? source.captured_at : "",
  };
}
