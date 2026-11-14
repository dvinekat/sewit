import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Заказ оплачен",
  description: "Демо-заказ SewIt создан.",
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

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  await requireUser("/checkout/success");
  const params = await searchParams;

  if (!params.order || !UUID_PATTERN.test(params.order)) notFound();

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, number, subtotal, discount, total, status, promo_code, created_at")
    .eq("id", params.order)
    .maybeSingle<{
      id: string;
      number: string;
      subtotal: number;
      discount: number;
      total: number;
      status: string;
      promo_code: string | null;
      created_at: string;
    }>();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("id, title, size_label, variant_key, price")
    .eq("order_id", order.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="text-center">
        <CheckCircle2 aria-hidden="true" className="mx-auto size-12 text-sage" />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Демо-оплата прошла
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Заказ {order.number}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {dateFormatter.format(new Date(order.created_at))} · статус «оплачен», деньги не
          списывались.
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-line bg-card p-6">
        <h2 className="font-display text-xl">Состав</h2>
        <ul className="mt-3 divide-y divide-line/70 text-sm">
          {(items ?? []).map((item) => (
            <li key={item.id} className="flex flex-wrap justify-between gap-3 py-3">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  Размер {item.size_label}
                  {item.variant_key !== "none" ? ` · ${item.variant_key}` : ""}
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
              <dt>Скидка{order.promo_code ? ` (${order.promo_code})` : ""}</dt>
              <dd>−{formatPrice(order.discount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4 text-base">
            <dt>Итого</dt>
            <dd className="font-display text-xl">{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </div>

      <p className="mt-4 rounded-2xl border border-line bg-secondary/40 p-4 text-xs leading-relaxed text-muted-foreground">
        Заказ сохранён в истории покупок. PDF с титульным листом уже доступен в разделе «Мои
        выкройки» — скачивание можно повторять без ограничений.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/account/orders" className={buttonVariants({ size: "lg" })}>
          История заказов
        </Link>
        <Link href="/account" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
          В личный кабинет
        </Link>
      </div>
    </div>
  );
}
