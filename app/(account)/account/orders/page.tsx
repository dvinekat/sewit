import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { formatPrice } from "@/lib/format";
import { listMyOrders, orderStatusLabel } from "@/lib/orders/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "История заказов",
  description: "Заказы SewIt.",
  robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function OrdersPage() {
  await requireUser("/account/orders");
  const orders = await listMyOrders();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Заказы</p>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">История покупок</h1>
        </div>
        <Link href="/catalog" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          В каталог
        </Link>
      </header>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-card p-10 text-center">
          <p className="font-display text-2xl">Покупок пока нет</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            После демо-оплаты заказ появится здесь: номер, дата, состав и сумма.
          </p>
          <Link href="/catalog" className={cn(buttonVariants({ size: "lg" }), "mt-5")}>
            Выбрать выкройку
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/account/orders/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-card p-5 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <div>
                  <p className="font-display text-lg">{order.number}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {dateFormatter.format(new Date(order.createdAt))} · позиций: {order.itemCount}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={order.status === "paid" ? "sage" : "outline"}>
                    {orderStatusLabel(order.status)}
                  </Badge>
                  <p className="font-display text-lg">{formatPrice(order.total)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
