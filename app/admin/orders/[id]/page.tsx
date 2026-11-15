import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { getAdminOrder } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/guards";
import { formatPrice } from "@/lib/format";
import { parseMeasurementsSnapshot } from "@/lib/orders/measurements-snapshot";
import { orderStatusLabel } from "@/lib/orders/queries";

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

const measureFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });

/** Карточка заказа для администратора: покупатель, состав, скидка и мерки (T-41). */
export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  if (!UUID_PATTERN.test(id)) notFound();

  const order = await getAdminOrder(id);
  if (!order) notFound();

  const snapshot = parseMeasurementsSnapshot(order.measurementsSnapshot);

  return (
    <div className="space-y-6">
      <nav aria-label="Хлебные крошки" className="text-sm text-muted-foreground">
        <Link href="/admin/orders" className="transition-colors hover:text-foreground">
          Заказы
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

      <div className="grid gap-4 sm:grid-cols-2">
        <section
          aria-labelledby="buyer-title"
          className="rounded-2xl border border-line bg-card p-5"
        >
          <h2 id="buyer-title" className="font-display text-xl">
            Покупатель
          </h2>

          {order.buyer ? (
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">E-mail</dt>
                <dd className="mt-0.5 break-all font-medium">{order.buyer.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Имя</dt>
                <dd className="mt-0.5 font-medium">{order.buyer.name ?? "Не указано"}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Аккаунт удалён: заказ остался обезличенным (FR-6.5). Персональных данных покупателя в
              нём нет.
            </p>
          )}
        </section>

        <section
          aria-labelledby="totals-title"
          className="rounded-2xl border border-line bg-card p-5"
        >
          <h2 id="totals-title" className="font-display text-xl">
            Суммы
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Позиций</dt>
              <dd>{order.itemCount}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Сумма</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                Скидка{order.promoCode ? ` (${order.promoCode})` : ""}
              </dt>
              <dd>{order.discount > 0 ? `−${formatPrice(order.discount)}` : "—"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-line/70 pt-2 text-base">
              <dt>Итого</dt>
              <dd className="font-display text-xl">{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section aria-labelledby="items-title" className="rounded-2xl border border-line bg-card p-5">
        <h2 id="items-title" className="font-display text-xl">
          Состав заказа
        </h2>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="py-2 pr-3 font-medium">
                  Выкройка
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Размер
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Параметры
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  Цена
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2.5 pr-3 font-medium">{item.title}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{item.sizeLabel}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">
                    {item.variantKey === "none" ? "Базовый" : item.variantKey}
                  </td>
                  <td className="py-2.5 text-right font-display">{formatPrice(item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        aria-labelledby="snapshot-title"
        className="rounded-2xl border border-line bg-card p-5"
      >
        <h2 id="snapshot-title" className="font-display text-xl">
          Мерки на момент покупки
        </h2>

        {snapshot ? (
          <>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {[
                { label: "ОГ", value: snapshot.bust },
                { label: "ОТ", value: snapshot.waist },
                { label: "ОБ", value: snapshot.hips },
                { label: "Рост", value: snapshot.height },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-xs text-muted-foreground">{item.label}</dt>
                  <dd className="mt-0.5 font-display text-xl">
                    {measureFormatter.format(item.value)} см
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-3 text-sm text-muted-foreground">
              Рекомендация SewIt: размер {snapshot.recommended_size || "—"}
              {snapshot.alternatives.length > 0
                ? `, альтернативы — ${snapshot.alternatives.join(", ")}`
                : ""}
              .
            </p>

            {snapshot.warnings.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {snapshot.warnings.map((warning) => (
                  <li
                    key={warning.code}
                    className="rounded-xl border border-line/70 bg-background p-3"
                  >
                    <p className="text-sm font-medium">{warning.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {warning.message}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Мерок в заказе нет: покупатель не сохранял их в профиле или аккаунт удалён.
          </p>
        )}
      </section>

      <p className="rounded-2xl border border-line bg-secondary/40 p-4 text-xs leading-relaxed text-muted-foreground">
        Демонстрационный заказ: деньги не списывались, статус меняется только вручную в Supabase.
        Состав и суммы неизменяемы, чтобы история покупок сходилась с библиотекой покупателя.
      </p>
    </div>
  );
}
