"use client";

import { useState } from "react";

import { formatFabricConsumption, formatPrice } from "@/lib/format";
import type { ParamCode, PatternParam, PatternSize } from "@/lib/pattern-domain";
import { validateVariantSelection, variantTitle, type VariantSelection } from "@/lib/variant";
import { cn } from "@/lib/utils";

const measureFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });

/** Первая доступная комбинация — пресет по умолчанию (FR-4.2). */
function defaultSelection(params: readonly PatternParam[]): VariantSelection {
  const selection: VariantSelection = {};

  for (const param of params) {
    const first = param.values.find((value) => value.available);
    if (first) selection[param.code] = first.value;
  }

  return selection;
}

/**
 * Размер и параметры выкройки (T-24, T-26, FR-2.5, FR-4.1–4.2).
 *
 * Размер и параметры — одно клиентское состояние: таблица, состав набора и цена
 * пересчитываются сразу, без перезагрузки. Для выкройки без параметров блок
 * параметров не рендерится; недоступные значения помечены «в разработке».
 */
export function PatternConfigurator({
  sizes,
  params,
  price,
}: {
  sizes: PatternSize[];
  params: PatternParam[];
  price: number;
}) {
  const [sizeLabel, setSizeLabel] = useState(sizes[1]?.label ?? sizes[0]?.label ?? "");
  const [selection, setSelection] = useState<VariantSelection>(() => defaultSelection(params));

  const active = sizes.find((size) => size.label === sizeLabel) ?? sizes[0];
  if (!active) return null;

  const validation = validateVariantSelection(selection, params);
  const title = variantTitle(selection, params);

  function chooseValue(code: ParamCode, value: string) {
    setSelection((current) => ({ ...current, [code]: value }));
  }

  return (
    <section
      id="size-panel"
      aria-labelledby="size-panel-title"
      className="scroll-mt-24 rounded-3xl border border-line bg-card p-6"
    >
      <h2 id="size-panel-title" className="font-display text-xl">
        Размер и параметры
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Таблица доступна без регистрации. Выберите размер и параметры — состав набора и цена
        обновятся сразу.
      </p>

      <div role="group" aria-label="Выберите размер" className="mt-4 flex flex-wrap gap-2">
        {sizes.map((size) => {
          const isActive = size.label === active.label;

          return (
            <button
              key={size.label}
              type="button"
              aria-pressed={isActive}
              onClick={() => setSizeLabel(size.label)}
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

      {params.length > 0 ? (
        <div className="mt-5 space-y-4 border-t border-line/70 pt-4">
          {params.map((param) => (
            <fieldset key={param.code}>
              <legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {param.title}
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {param.values.map((value) => {
                  const isActive = selection[param.code] === value.value;

                  return (
                    <button
                      key={value.value}
                      type="button"
                      aria-pressed={isActive}
                      disabled={!value.available}
                      onClick={() => chooseValue(param.code, value.value)}
                      title={value.available ? undefined : "Вариант в разработке"}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-line bg-background text-foreground hover:border-primary/40 hover:bg-secondary",
                        !value.available &&
                          "cursor-not-allowed border-dashed text-muted-foreground opacity-70 hover:border-line hover:bg-background",
                      )}
                    >
                      {value.title}
                      {!value.available ? (
                        <span className="text-[10px] uppercase tracking-wide">в разработке</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      ) : null}

      <dl
        aria-live="polite"
        className="mt-5 grid gap-3 rounded-2xl bg-secondary/50 p-4 text-sm sm:grid-cols-2"
      >
        <div>
          <dt className="text-xs text-muted-foreground">Размер</dt>
          <dd className="mt-0.5 font-display text-xl">{active.label}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Расход ткани</dt>
          <dd className="mt-0.5 font-display text-xl">
            {formatFabricConsumption(active.fabricConsumptionM)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Вариант</dt>
          <dd className="mt-0.5 font-medium">{title}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Цена</dt>
          <dd className="mt-0.5 font-display text-xl">{formatPrice(price)}</dd>
        </div>
      </dl>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Состав набора: лекала PDF A4 на размер {active.label}, вариант «{title}» и памятка по печати
        без масштабирования. Цена на MVP одинакова для всех комбинаций; если файла под точный
        вариант нет, выдаётся ближайший доступный.
      </p>

      {!validation.ok ? (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {Object.values(validation.errors)[0] ?? "Проверьте выбранные параметры."}
        </p>
      ) : null}
    </section>
  );
}
