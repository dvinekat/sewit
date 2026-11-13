import type { CategorySlug, PatternSize } from "./pattern-domain";

/**
 * Подбор размера по меркам (README 6.1, T-18).
 *
 * Чистый модуль без БД и сети: на вход мерки и размеры выкройки, на выходе
 * рекомендация, альтернативы и предупреждения. Все пороги — константы ниже.
 */

export interface Measurements {
  bust: number;
  waist: number;
  hips: number;
  height: number;
}

export type GarmentType = "shoulder" | "waist";

export type SizeFitWarningCode = "borderline" | "height" | "spread";

export interface SizeFitWarning {
  code: SizeFitWarningCode;
  title: string;
  message: string;
}

export interface SizeFitScore {
  size: PatternSize;
  distance: number;
}

export interface SizeFitResult {
  recommended: PatternSize;
  alternatives: PatternSize[];
  warnings: SizeFitWarning[];
  scores: SizeFitScore[];
  /** Мерка, по которой советуем выбирать при пограничном размере. */
  dominantMeasure: "bust" | "hips";
}

/** Если два размера отличаются меньше чем на 3% — размер пограничный. */
export const BORDERLINE_DELTA = 0.03;

/** Отклонение роста от среднего роста размера, после которого нужна корректировка. */
export const HEIGHT_TOLERANCE_CM = 4;

/** Расхождение мерок на 2 шага размерной сетки — повод предупредить о подгонке. */
export const SPREAD_TOLERANCE_STEPS = 2;

/** Плечевые изделия выбирают по груди, поясные — по бёдрам. */
export function garmentTypeForCategory(category: CategorySlug): GarmentType {
  return category === "skirts" || category === "trousers" ? "waist" : "shoulder";
}

function relativeDeviation(value: number, reference: number): number {
  return Math.abs(value - reference) / reference;
}

/** d = 0,4·|ОГ−b|/b + 0,3·|ОТ−w|/w + 0,3·|ОБ−h|/h (README 6.1). */
export function sizeDistance(measurements: Measurements, size: PatternSize): number {
  return (
    0.4 * relativeDeviation(measurements.bust, size.bust) +
    0.3 * relativeDeviation(measurements.waist, size.waist) +
    0.3 * relativeDeviation(measurements.hips, size.hips)
  );
}

function nearestIndex(
  value: number,
  sizes: readonly PatternSize[],
  key: "bust" | "waist" | "hips",
): number {
  let bestIndex = 0;
  let bestDiff = Number.POSITIVE_INFINITY;

  sizes.forEach((size, index) => {
    const diff = Math.abs(value - size[key]);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function averageHeight(size: PatternSize): number {
  return (size.heightMin + size.heightMax) / 2;
}

function formatCm(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(".", ",");
}

/**
 * Рекомендует размер и собирает предупреждения.
 *
 * @throws если у выкройки нет размеров.
 */
export function fitSize(
  measurements: Measurements,
  sizes: readonly PatternSize[],
  garmentType: GarmentType,
): SizeFitResult {
  if (sizes.length === 0) {
    throw new Error("У выкройки нет размеров — подобрать размер невозможно");
  }

  const dominantMeasure = garmentType === "waist" ? "hips" : "bust";

  const scores: SizeFitScore[] = sizes
    .map((size) => ({ size, distance: sizeDistance(measurements, size) }))
    .sort((left, right) => {
      const byDistance = left.distance - right.distance;
      if (Math.abs(byDistance) > 1e-9) return byDistance;

      // Равенство: решаем по доминирующей мерке, затем в пользу большего размера.
      const leftDiff = Math.abs(measurements[dominantMeasure] - left.size[dominantMeasure]);
      const rightDiff = Math.abs(measurements[dominantMeasure] - right.size[dominantMeasure]);
      if (leftDiff !== rightDiff) return leftDiff - rightDiff;

      return right.size.bust - left.size.bust;
    });

  const recommended = scores[0]!.size;
  const alternatives = scores.slice(1, 3).map((score) => score.size);
  const warnings: SizeFitWarning[] = [];

  const runnerUp = scores[1];
  if (runnerUp && runnerUp.distance - scores[0]!.distance < BORDERLINE_DELTA) {
    const pair = [recommended, runnerUp.size].sort((a, b) => Number(a.label) - Number(b.label));
    const closerByDominant =
      Math.abs(measurements[dominantMeasure] - recommended[dominantMeasure]) <=
      Math.abs(measurements[dominantMeasure] - runnerUp.size[dominantMeasure])
        ? recommended
        : runnerUp.size;

    warnings.push({
      code: "borderline",
      title: "Пограничный размер",
      message:
        `Размеры ${pair[0]!.label} и ${pair[1]!.label} почти одинаково близки. ` +
        `Для ${garmentType === "waist" ? "поясного" : "плечевого"} изделия ориентируйтесь на ` +
        `${dominantMeasure === "bust" ? "обхват груди" : "обхват бёдер"}: ближе размер ${closerByDominant.label}.`,
    });
  }

  const heightDiff = Math.abs(measurements.height - averageHeight(recommended));
  if (heightDiff > HEIGHT_TOLERANCE_CM) {
    warnings.push({
      code: "height",
      title: "Нужна корректировка длины",
      message:
        `Рост ${formatCm(measurements.height)} см отличается от среднего для размера ${recommended.label} ` +
        `(${formatCm(averageHeight(recommended))} см) больше чем на ${HEIGHT_TOLERANCE_CM} см — ` +
        "длину придётся скорректировать по лекалам.",
    });
  }

  const measureIndexes = [
    nearestIndex(measurements.bust, sizes, "bust"),
    nearestIndex(measurements.waist, sizes, "waist"),
    nearestIndex(measurements.hips, sizes, "hips"),
  ];
  const spread = Math.max(...measureIndexes) - Math.min(...measureIndexes);

  if (spread >= SPREAD_TOLERANCE_STEPS) {
    const smallest = sizes[Math.min(...measureIndexes)]!;
    const largest = sizes[Math.max(...measureIndexes)]!;

    warnings.push({
      code: "spread",
      title: "Мерки расходятся",
      message:
        `Обхваты соответствуют разным размерам (${smallest.label} и ${largest.label}) — ` +
        "потребуется подгонка по талии или бёдрам.",
    });
  }

  return { recommended, alternatives, warnings, scores, dominantMeasure };
}
