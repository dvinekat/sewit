import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getAdminDashboard } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/guards";
import { formatPrice, pluralizeRu } from "@/lib/format";
import { orderStatusLabel } from "@/lib/orders/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Админка",
  description: "Служебный раздел SewIt.",
  robots: { index: false, follow: false },
};

const numberFormatter = new Intl.NumberFormat("ru-RU");
const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/**
 * Дашборд админки (T-38).
 *
 * Счётчики и последние заказы читаются под ролью admin: черновики и чужие
 * заказы видны только администратору благодаря RLS, а не фильтрам в коде.
 */
export default async function AdminPage() {
  const admin = await requireAdmin();
  const dashboard = await getAdminDashboard();

  const stats = [
    { label: "Опубликовано выкроек", value: numberFormatter.format(dashboard.published) },
    { label: "Черновиков", value: numberFormatter.format(dashboard.drafts) },
    { label: "Заказов всего", value: numberFormatter.format(dashboard.orders) },
    { label: "Выручка (демо)", value: formatPrice(dashboard.revenue) },
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Обзор</p>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Служебный раздел</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Вы вошли как {admin.email}. Здесь видно состояние каталога, продаж и промокодов; действия
          доступны в разделах слева.
        </p>
      </header>

      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-line bg-card p-5">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</dt>
            <dd className="mt-2 font-display text-2xl xl:text-3xl">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <section
        aria-labelledby="recent-orders"
        className="rounded-2xl border border-line bg-card p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="recent-orders" className="font-display text-xl">
            Последние заказы
          </h2>
          <Link
            href="/admin/orders"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Все заказы
          </Link>
        </div>

        {dashboard.recent.length === 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Заказов пока нет. Демо-оплата появится здесь сразу после оформления покупки.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Заказ
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Покупатель
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Дата
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Статус
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    Итого
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {dashboard.recent.map((order) => (
                  <tr key={order.id}>
                    <td className="py-2.5 pr-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {order.number}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">
                      {order.buyer?.email ?? "Аккаунт удалён"}
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">
                      {dateFormatter.format(new Date(order.createdAt))}
                    </td>
                    <td className="py-2.5 pr-3">{orderStatusLabel(order.status)}</td>
                    <td className="py-2.5 text-right font-display">{formatPrice(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="font-display text-xl">Промокоды</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {dashboard.activePromos > 0
              ? `${dashboard.activePromos} ${pluralizeRu(dashboard.activePromos, "активный промокод", "активных промокода", "активных промокодов")}.`
              : "Активных промокодов нет — скидку на оформлении сейчас получить нельзя."}
          </p>
          <Link
            href="/admin/promo"
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-4")}
          >
            Управлять промокодами
          </Link>
        </section>

        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="font-display text-xl">Сводка продаж</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Сумма оплаченных заказов, средний чек и топ-3 выкройки за 30 дней, 90 дней или всё
            время.
          </p>
          <Link
            href="/admin/sales"
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-4")}
          >
            Открыть сводку
          </Link>
        </section>
      </div>
    </div>
  );
}
