import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { formatPrice } from "@/lib/format";
import { getMyOrder, orderStatusLabel } from "@/lib/orders/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Заказ",
  robots: { index: false, follow: false },
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("/account/orders");
  const { id } = await params;

  if (!UUID_PATTERN.test(id)) notFound();

  const order = await getMyOrder(id);
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <nav aria-label="Хлебные крошки" className="text-sm text-muted-foreground">
        <Link href="/account/orders" className="transition-colors hover:text-foreground">
          История заказов
        </Link>
        <span aria-hidden="true" className="px-2 text-line">
          /
        </span>
        <span className="text-foreground">{order.number}</span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Заказ</p>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{order.number}</h1>
          <p className="text-sm text-muted-foreground">
            {dateFormatter.format(new Date(order.createdAt))}
          </p>
        </div>
        <Badge variant={order.status === "paid" ? "sage" : "outline"}>
          {orderStatusLabel(order.status)}
        </Badge>
      </header>

      <section className="rounded-3xl border border-line bg-card p-6">
        <h2 className="font-display text-xl">Состав</h2>
        <ul className="mt-3 divide-y divide-line/70 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex flex-wrap justify-between gap-3 py-3">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  Размер {item.sizeLabel}
                  {item.variantKey !== "none" ? ` · ${item.variantKey}` : ""}
                </p>
              </div>
              <p className="font-display">{formatPrice(item.price)}</p>
            </li>
          ))}
        </ul>

        <dl className="mt-3 space-y-2 border-t border-line/70 pt-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Сумма</dt>
            <dd>{formatPrice(order.subtotal)}</dd>
          </div>
          {order.discount > 0 ? (
            <div className="flex justify-between gap-4 text-sage">
              <dt>Скидка{order.promoCode ? ` (${order.promoCode})` : ""}</dt>
              <dd>−{formatPrice(order.discount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4 text-base">
            <dt>Итого</dt>
            <dd className="font-display text-xl">{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </section>

      <p className="rounded-2xl border border-line bg-secondary/40 p-4 text-xs leading-relaxed text-muted-foreground">
        Это демонстрационный заказ: деньги не списывались. Лекала с титульным листом доступны в
        разделе «Мои выкройки».
      </p>

      <div className="flex flex-wrap gap-3">
        <Link href="/account/library" className={cn(buttonVariants({ variant: "outline" }))}>
          Мои выкройки
        </Link>
        <Link href="/account/orders" className={cn(buttonVariants({ variant: "ghost" }))}>
          Все заказы
        </Link>
      </div>
    </div>
  );
}
