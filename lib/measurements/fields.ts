import type { MeasurementsField } from "@/lib/schemas/measurements";

/**
 * Метаданные четырёх мерок (T-19, README 3.1).
 *
 * Один источник подписей, подсказок и диапазонов: их используют подбор размера
 * в карточке выкройки и форма мерок в профиле (T-37).
 */
export interface MeasurementFieldMeta {
  name: MeasurementsField;
  /** Полная подпись для формы. */
  label: string;
  /** Короткая подпись для компактной таблицы. */
  short: string;
  hint: string;
  placeholder: string;
  min: number;
  max: number;
}

export const MEASUREMENT_FIELDS: readonly MeasurementFieldMeta[] = [
  {
    name: "bust",
    label: "Обхват груди (ОГ)",
    short: "ОГ",
    hint: "По самой выступающей точке",
    placeholder: "88",
    min: 50,
    max: 200,
  },
  {
    name: "waist",
    label: "Обхват талии (ОТ)",
    short: "ОТ",
    hint: "По самому узкому месту",
    placeholder: "70",
    min: 40,
    max: 200,
  },
  {
    name: "hips",
    label: "Обхват бёдер (ОБ)",
    short: "ОБ",
    hint: "По самой широкой точке",
    placeholder: "96",
    min: 50,
    max: 200,
  },
  {
    name: "height",
    label: "Рост",
    short: "Рост",
    hint: "Без обуви",
    placeholder: "168",
    min: 120,
    max: 220,
  },
];
