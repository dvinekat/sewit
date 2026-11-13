const priceFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

/**
 * Цены в БД и заказах хранятся в копейках (README 5), в UI показываем рубли.
 * @throws RangeError если передано отрицательное или нечисловое значение.
 */
export function formatPrice(kopecks: number): string {
  if (!Number.isFinite(kopecks) || kopecks < 0) {
    throw new RangeError("Цена должна быть неотрицательным числом в копейках");
  }
  return `${priceFormatter.format(Math.round(kopecks / 100))} ₽`;
}

/** Русское склонение: 1 выкройка, 2 выкройки, 5 выкроек. */
export function pluralizeRu(count: number, one: string, few: string, many: string): string {
  const mod10 = Math.abs(count) % 10;
  const mod100 = Math.abs(count) % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function formatSewingHours(hours: number): string {
  return `${hours} ${pluralizeRu(hours, "час", "часа", "часов")}`;
}

export function formatPatternCount(count: number): string {
  return `${count} ${pluralizeRu(count, "выкройка", "выкройки", "выкроек")}`;
}

const LEVEL_LABELS: Record<number, string> = {
  1: "Низкая",
  2: "Ниже среднего",
  3: "Средняя",
  4: "Выше среднего",
  5: "Высокая",
};

/** Уровень сложности 1–5 из README 5 в человекочитаемую подпись. */
export function getLevelLabel(level: number): string {
  return LEVEL_LABELS[level] ?? "Не указан";
}
