import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { listAdminOrders } from "@/lib/admin/queries";
import { hasOrderFilters, parseOrderFilter } from "@/lib/admin/order-filter";
import { requireAdmin } from "@/lib/auth/guards";
import { formatPrice } from "@/lib/format";
import { orderStatusLabel } from "@/lib/orders/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Заказы",
  robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const inputClass =
  "h-10 w-full rounded-xl border border-line bg-background px-3 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40";

const STATUS_OPTIONS = [
  { value: "all", label: "Все статусы" },
  { value: "paid", label: "Оплачен" },
  { value: "refunded", label: "Возврат" },
] as const;

/**
 * Список заказов с фильтрами (T-41, FR-8.4).
 *
 * Фильтр живёт в URL: ссылку на подборку можно сохранить, а форма — обычный GET.
 * Чужой заказ не откроется и по прямой ссылке: RLS отдаёт администратору только
 * те строки, что и списку, а карточка заказа дополнительно проверяет `null`.
 */
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();

  const filter = parseOrderFilter(await searchParams);
  const orders = await listAdminOrders(filter);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Заказы</p>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">История продаж</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Показываются последние 100 заказов. Состав каждой покупки и обезличенные аккаунты видны в
          карточке.
        </p>
      </header>

      <form
        method="get"
        className="grid gap-3 rounded-2xl border border-line bg-card p-4 sm:grid-cols-2 lg:grid-cols-[1fr_150px_150px_180px_auto] lg:items-end"
      >
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Номер заказа</span>
          <input
            type="search"
            name="q"
            defaultValue={filter.q ?? ""}
            placeholder="SW-20261115-0001"
            className={cn(inputClass, "mt-1")}
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Статус</span>
          <select name="status" defaultValue={filter.status} className={cn(inputClass, "mt-1")}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">С даты</span>
          <input
            type="date"
            name="from"
            defaultValue={filter.from ?? ""}
            className={cn(inputClass, "mt-1")}
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">По дату</span>
          <input
            type="date"
            name="to"
            defaultValue={filter.to ?? ""}
            className={cn(inputClass, "mt-1")}
          />
        </label>

        <div className="flex items-center gap-2">
          <button type="submit" className={cn(buttonVariants({ size: "sm" }), "h-10")}>
            Показать
          </button>
          {hasOrderFilters(filter) ? (
            <Link
              href="/admin/orders"
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Сбросить
            </Link>
          ) : null}
        </div>
      </form>

      {orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-card p-6 text-sm leading-relaxed text-muted-foreground">
          {hasOrderFilters(filter)
            ? "По этим условиям заказов нет. Попробуйте расширить период или сбросить фильтры."
            : "Заказов пока нет: покупатели ещё не оформляли демо-оплату."}
        </p>
      ) : (
        <section aria-labelledby="orders-table" className="rounded-2xl border border-line bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 px-4 py-3">
            <h2 id="orders-table" className="font-display text-lg">
              Найдено: {orders.length}
            </h2>
            <p className="text-xs text-muted-foreground">Сначала новые</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="px-4 py-2 font-medium">
                    Заказ
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Покупатель
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Дата
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Позиций
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Статус
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">
                    Итого
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {orders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-secondary/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {order.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {order.buyer?.email ?? "Аккаунт удалён"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {dateFormatter.format(new Date(order.createdAt))}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{order.itemCount}</td>
                    <td className="px-4 py-3">
                      <Badge variant={order.status === "paid" ? "sage" : "outline"}>
                        {orderStatusLabel(order.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-display">
                      {formatPrice(order.total)}
                      {order.discount > 0 ? (
                        <span className="block text-xs text-sage">
                          скидка {formatPrice(order.discount)}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
