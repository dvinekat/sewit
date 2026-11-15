/**
 * Сводка продаж (T-42, FR-8.5): чистые вычисления без БД.
 *
 * Считаются только оплаченные заказы (`status = paid`): возвраты и отмены
 * не должны раздувать выручку и топ выкроек. Функция используется страницей
 * `/admin/sales` и тестами, поэтому работает с простыми срезами строк.
 */

export interface SalesOrderInput {
  id: string;
  /** Итог заказа в копейках — уже за вычетом скидки. */
  total: number;
  /** Скидка в копейках. */
  discount: number;
  status: string;
  createdAt: string;
}

export interface SalesItemInput {
  orderId: string;
  patternId: string;
  title: string;
  /** Цена позиции в копейках. */
  price: number;
}

export interface TopPattern {
  patternId: string;
  title: string;
  /** Сколько раз выкройку купили. */
  units: number;
  /** Выручка по этой выкройке в копейках. */
  revenue: number;
}

export interface SalesSummary {
  /** Число оплаченных заказов. */
  orders: number;
  /** Выручка в копейках. */
  revenue: number;
  /** Суммарная скидка по оплаченным заказам, копейки. */
  discounts: number;
  /** Средний чек в копейках; 0 — заказов нет. */
  averageOrder: number;
  /** Продано позиций (штук выкроек). */
  items: number;
  topPatterns: TopPattern[];
}

const EMPTY_SUMMARY: SalesSummary = {
  orders: 0,
  revenue: 0,
  discounts: 0,
  averageOrder: 0,
  items: 0,
  topPatterns: [],
};

export function summarizeSales(
  orders: readonly SalesOrderInput[],
  items: readonly SalesItemInput[],
  topLimit = 3,
): SalesSummary {
  const paidOrders = orders.filter((order) => order.status === "paid");

  if (paidOrders.length === 0) return { ...EMPTY_SUMMARY, topPatterns: [] };

  const paidIds = new Set(paidOrders.map((order) => order.id));
  const paidItems = items.filter((item) => paidIds.has(item.orderId));

  const byPattern = new Map<string, TopPattern>();

  for (const item of paidItems) {
    const current = byPattern.get(item.patternId);

    if (current) {
      current.units += 1;
      current.revenue += item.price;
    } else {
      byPattern.set(item.patternId, {
        patternId: item.patternId,
        title: item.title,
        units: 1,
        revenue: item.price,
      });
    }
  }

  const topPatterns = [...byPattern.values()]
    .sort(
      (a, b) => b.units - a.units || b.revenue - a.revenue || a.title.localeCompare(b.title, "ru"),
    )
    .slice(0, Math.max(0, topLimit));

  const revenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const discounts = paidOrders.reduce((sum, order) => sum + order.discount, 0);

  return {
    orders: paidOrders.length,
    revenue,
    discounts,
    averageOrder: Math.round(revenue / paidOrders.length),
    items: paidItems.length,
    topPatterns,
  };
}
