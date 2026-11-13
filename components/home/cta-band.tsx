import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CtaBand() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-12 text-paper sm:px-10 lg:px-14 lg:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full border border-paper/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 right-24 size-64 rounded-full border border-paper/10"
        />

        <div className="relative max-w-2xl space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-paper/60">
            Начните с одной выкройки
          </p>
          <h2 className="font-display text-3xl leading-tight tracking-tight text-balance sm:text-4xl">
            Подберите размер и соберите первый комплект лекал
          </h2>
          <p className="text-sm leading-relaxed text-paper/70 sm:text-base">
            Откройте каталог, выберите модель и посмотрите, как мерки превращаются в готовый PDF A4
            с тестовой страницей масштаба.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/catalog"
              className={cn(buttonVariants({ size: "lg" }), "bg-paper text-ink hover:bg-paper/90")}
            >
              Смотреть каталог
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link
              href="/#how-it-works"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "border-paper/25 text-paper hover:bg-paper/10",
              )}
            >
              Как это работает
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
