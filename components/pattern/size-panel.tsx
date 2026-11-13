"use client";

import { useState } from "react";

import { formatFabricConsumption } from "@/lib/format";
import type { PatternSize } from "@/lib/pattern-domain";
import { cn } from "@/lib/utils";

const measureFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });

/**
 * Таблица размеров и расход ткани (T-14).
 *
 * Размер — это клиентское состояние страницы: выбор меняет сводку расхода,
 * но не URL. Для корзины размер поедет отдельным параметром (T-28).
 */
export function SizePanel({ sizes }: { sizes: PatternSize[] }) {
  const initial = sizes[1]?.label ?? sizes[0]?.label ?? "";
  const [selected, setSelected] = useState(initial);

  const active = sizes.find((size) => size.label === selected) ?? sizes[0];

  if (!active) return null;

  return (
    <section
      id="size-panel"
      aria-labelledby="size-panel-title"
      className="scroll-mt-24 rounded-3xl border border-line bg-card p-6"
    >
      <h2 id="size-panel-title" className="font-display text-xl">
        Размеры и расход ткани
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Таблица доступна без регистрации. Выберите размер — покажем расход ткани и рост.
      </p>

      <div role="group" aria-label="Выберите размер" className="mt-4 flex flex-wrap gap-2">
        {sizes.map((size) => {
          const isActive = size.label === active.label;

          return (
            <button
              key={size.label}
              type="button"
              aria-pressed={isActive}
              onClick={() => setSelected(size.label)}
              className={cn(
                "min-w-12 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-line bg-background text-foreground hover:border-primary/40 hover:bg-secondary",
              )}
            >
              {size.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[320px] border-collapse text-sm">
          <caption className="sr-only">
            Таблица размеров выкройки: обхваты и рост в сантиметрах
          </caption>
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="py-2 pr-3 font-medium">
                Размер
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                ОГ
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                ОТ
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                ОБ
              </th>
              <th scope="col" className="py-2 font-medium">
                Рост
              </th>
            </tr>
          </thead>
          <tbody>
            {sizes.map((size) => (
              <tr
                key={size.label}
                className={cn(
                  "border-b border-line/60 last:border-0",
                  size.label === active.label && "bg-secondary/60",
                )}
              >
                <th scope="row" className="py-2 pr-3 text-left font-medium">
                  {size.label}
                </th>
                <td className="py-2 pr-3">{measureFormatter.format(size.bust)}</td>
                <td className="py-2 pr-3">{measureFormatter.format(size.waist)}</td>
                <td className="py-2 pr-3">{measureFormatter.format(size.hips)}</td>
                <td className="py-2">
                  {measureFormatter.format(size.heightMin)}–
                  {measureFormatter.format(size.heightMax)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl
        aria-live="polite"
        className="mt-4 grid gap-3 rounded-2xl bg-secondary/50 p-4 text-sm sm:grid-cols-2"
      >
        <div>
          <dt className="text-xs text-muted-foreground">Расход ткани, размер {active.label}</dt>
          <dd className="mt-1 font-display text-xl">
            {formatFabricConsumption(active.fabricConsumptionM)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Рост для размера {active.label}</dt>
          <dd className="mt-1 font-display text-xl">
            {measureFormatter.format(active.heightMin)}–{measureFormatter.format(active.heightMax)}{" "}
            см
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-muted-foreground">
        Расход указан при ширине ткани 140–145 см. Для другого размера выберите кнопку выше.
      </p>
    </section>
  );
}
