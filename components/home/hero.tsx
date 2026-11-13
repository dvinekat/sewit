import { ArrowRight, Check, Ruler } from "lucide-react";
import Link from "next/link";

import { PatternCover } from "@/components/pattern-cover";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line/70">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-32 size-[34rem] rounded-full bg-primary/5 blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:py-24">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-sage" />
            Новая коллекция · 2026
          </p>

          <h1 className="mt-6 font-display text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Выкройки, которые садятся <span className="italic text-primary">по вашей фигуре</span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Снимите мерки — SewIt предложит размер, поможет выбрать длину и рукав, а после оплаты
            отдаст готовые лекала PDF A4. Без конструкторских курсов и подгонки на глаз.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/catalog" className={buttonVariants({ size: "lg" })}>
              Открыть каталог
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link
              href="/#how-it-works"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              Как это работает
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {["6 моделей", "Размеры 42 · 46 · 50", "PDF A4"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check aria-hidden="true" className="size-4 text-sage" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-[420px] lg:max-w-none">
          <div
            aria-hidden="true"
            className="absolute -inset-6 rounded-[3rem] bg-primary/5 blur-2xl"
          />

          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-line shadow-[0_32px_64px_-32px_rgba(33,29,25,0.45)]">
            <PatternCover slug="dress-shirt" className="absolute inset-0" />

            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-line/70 bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur">
              <Ruler aria-hidden="true" className="size-3.5 text-primary" />
              ОГ 88 · ОТ 70 · ОБ 96
            </div>

            <div className="absolute right-4 top-4 hidden rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur sm:block">
              midi + короткий рукав
            </div>

            <div className="absolute bottom-4 right-4 rounded-2xl border border-line/70 bg-background/95 px-4 py-3 shadow-sm backdrop-blur">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Рекомендуемый размер
              </p>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-3xl leading-none text-foreground">46</span>
                <span className="flex items-center gap-1 text-xs text-sage">
                  <Check aria-hidden="true" className="size-3.5" />
                  по меркам
                </span>
              </p>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="absolute -bottom-4 -right-4 hidden h-full w-full rounded-[2rem] border border-dashed border-primary/25 sm:block"
          />
        </div>
      </div>
    </section>
  );
}
