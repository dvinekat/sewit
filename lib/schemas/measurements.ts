import { z } from "zod";

/**
 * Схема мерок: одна валидация на форму и на будущий серверный экшен (T-19).
 * Диапазоны — из README 3.1; значения в сантиметрах, допускаются полсантиметра
 * и запятая как десятичный разделитель («96,5»).
 */

function centimeters(min: number, max: number, label: string) {
  return z.preprocess(
    (value) => (typeof value === "string" ? value.trim().replace(",", ".") : value),
    z.coerce.number().min(min, `${label}: от ${min} см`).max(max, `${label}: до ${max} см`),
  );
}

export const measurementsSchema = z.object({
  bust: centimeters(50, 200, "Обхват груди"),
  waist: centimeters(40, 200, "Обхват талии"),
  hips: centimeters(50, 200, "Обхват бёдер"),
  height: centimeters(120, 220, "Рост"),
});

export type MeasurementsValues = z.infer<typeof measurementsSchema>;

export type MeasurementsField = keyof MeasurementsValues;

/** Первая ошибка по каждому полю — в формате, удобном для формы. */
export function fieldErrors(error: z.ZodError): Partial<Record<MeasurementsField, string>> {
  const errors: Partial<Record<MeasurementsField, string>> = {};
  const fields = new Set<string>(["bust", "waist", "hips", "height"]);

  for (const issue of error.issues) {
    const key = issue.path[0];

    if (typeof key === "string" && fields.has(key) && !errors[key as MeasurementsField]) {
      errors[key as MeasurementsField] = issue.message;
    }
  }

  return errors;
}
