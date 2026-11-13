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
