/**
 * Фильтр заказов в админке (T-41, FR-8.4).
 *
 * Парсинг вынесен из страницы: мусор в query-строке не должен ломать запрос
 * к БД, поэтому невалидные статусы и даты просто отбрасываются. Модуль чистый
 * (без Next.js и Supabase) и покрыт тестами.
 */

export const ORDER_STATUS_FILTERS = ["all", "paid", "refunded", "pending", "canceled"] as const;

export type OrderStatusFilter = (typeof ORDER_STATUS_FILTERS)[number];

export interface AdminOrderFilter {
  status: OrderStatusFilter;
  /** Начало периода, `YYYY-MM-DD`, или null. */
  from: string | null;
  /** Конец периода включительно, `YYYY-MM-DD`, или null. */
  to: string | null;
  /** Поиск по номеру заказа. */
  q: string | null;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(value: string | undefined): string | null {
  if (!value || !DATE_PATTERN.test(value)) return null;

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;

  // Date нормализует 2026-02-31 в март — такой ввод тоже считаем опечаткой.
  return date.toISOString().slice(0, 10) === value ? value : null;
}

export function parseOrderFilter(
  params: Record<string, string | string[] | undefined>,
): AdminOrderFilter {
  const first = (key: string): string | undefined => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const statusValue = first("status");
  const status: OrderStatusFilter = (ORDER_STATUS_FILTERS as readonly string[]).includes(
    statusValue ?? "",
  )
    ? (statusValue as OrderStatusFilter)
    : "all";

  const q = first("q")?.trim().slice(0, 40) ?? "";

  return {
    status,
    from: parseDate(first("from")),
    to: parseDate(first("to")),
    q: q || null,
  };
}

/** Границы периода в ISO: `from` — начало дня, `to` — конец дня включительно. */
export function orderDateBounds(filter: Pick<AdminOrderFilter, "from" | "to">): {
  fromIso: string | null;
  toIso: string | null;
} {
  return {
    fromIso: filter.from ? `${filter.from}T00:00:00.000Z` : null,
    toIso: filter.to ? `${filter.to}T23:59:59.999Z` : null,
  };
}

/** Есть ли активные фильтры — для ссылки «Сбросить». */
export function hasOrderFilters(filter: AdminOrderFilter): boolean {
  return filter.status !== "all" || Boolean(filter.from || filter.to || filter.q);
}
