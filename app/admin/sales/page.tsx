import type { Metadata } from "next";
import Link from "next/link";

import { getSalesSummary, type SalesRange } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/guards";
import { formatPrice, pluralizeRu } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Сводка продаж",
  robots: { index: false, follow: false },
};

const numberFormatter = new Intl.NumberFormat("ru-RU");

const RANGES: { value: SalesRange; label: string }[] = [
  { value: "30", label: "30 дней" },
  { value: "90", label: "90 дней" },
  { value: "all", label: "Всё время" },
];

function parseRange(value: string | string[] | undefined): SalesRange {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "90" || raw === "all" ? raw : "30";
}

/**
 * Сводка продаж (T-42, FR-8.5).
 *
 * Сумма считается только по оплаченным заказам, а топ выкроек — по позициям
 * этих заказов. Возвраты и отмены в выручку не попадают: иначе отчёт не сойдётся
 * с суммой, которую видит бухгалтерия демо-стенда.
 */
export default async function AdminSalesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();

  const range = parseRange((await searchParams).range);
  const summary = await getSalesSummary(range);

  const stats = [
    { label: "Выручка", value: formatPrice(summary.revenue) },
    {
      label: "Оплаченных заказов",
      value: numberFormatter.format(summary.orders),
    },
    {
      label: "Средний чек",
      value: summary.orders > 0 ? formatPrice(summary.averageOrder) : "—",
    },
    { label: "Скидки", value: formatPrice(summary.discounts) },
    {
      label: "Позиций продано",
      value: `${numberFormatter.format(summary.items)} ${pluralizeRu(summary.items, "штука", "штуки", "штук")}`,
    },
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Сводка продаж
        </p>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Как продаётся каталог</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Выручка и топ считаются по оплаченным демо-заказам. Возвраты и отмены в сумму не входят,
          но остаются в истории заказов.
        </p>
      </header>

      <nav aria-label="Период" className="flex flex-wrap gap-2">
        {RANGES.map((item) => {
          const active = item.value === range;

          return (
            <Link
              key={item.value}
              href={`/admin/sales?range=${item.value}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-line bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-line bg-card p-5">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</dt>
            <dd className="mt-2 font-display text-2xl xl:text-3xl">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <section
        aria-labelledby="top-patterns"
        className="rounded-2xl border border-line bg-card p-5"
      >
        <h2 id="top-patterns" className="font-display text-xl">
          Топ-3 выкройки
        </h2>

        {summary.topPatterns.length === 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            За выбранный период оплаченных заказов нет. Попробуйте «Всё время» или оформите
            демо-заказ, чтобы увидеть отчёт.
          </p>
        ) : (
          <ol className="mt-3 divide-y divide-line/70 text-sm">
            {summary.topPatterns.map((pattern, index) => (
              <li key={pattern.patternId} className="flex flex-wrap items-center gap-3 py-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary font-display">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{pattern.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {pattern.units} {pluralizeRu(pattern.units, "продажа", "продажи", "продаж")} ·{" "}
                    {formatPrice(pattern.revenue)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <p className="rounded-2xl border border-line bg-secondary/40 p-4 text-xs leading-relaxed text-muted-foreground">
        Демо-оплата: реальные деньги не списываются, поэтому «выручка» — учебный показатель. Суммы в
        отчёте совпадают с суммой оплаченных заказов в разделе «Заказы».
      </p>
    </div>
  );
}
