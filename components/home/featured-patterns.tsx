import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { PatternCard } from "@/components/pattern-card";
import { SectionHeading } from "@/components/section-heading";
import { buttonVariants } from "@/components/ui/button";
import type { CategoryWithCount, Pattern } from "@/lib/patterns";
import { cn } from "@/lib/utils";

export function FeaturedPatterns({
  patterns,
  categories,
}: {
  patterns: Pattern[];
  categories: CategoryWithCount[];
}) {
  const categoryTitles = new Map(categories.map((category) => [category.slug, category.title]));

  return (
    <section aria-labelledby="featured-title" className="border-b border-line/70">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeading
          id="featured-title"
          eyebrow="Подборка"
          title="Выкройки, с которых удобно начать"
          description="Шесть моделей коллекции — от простой юбки до худи оверсайз. Размеры 42, 46 и 50 у каждой."
          action={
            <Link
              href="/catalog"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "group")}
            >
              Все выкройки
              <ArrowRight
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          }
        />

        {patterns.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-line bg-card p-10 text-center">
            <p className="font-display text-xl">Пока пусто</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Опубликованных выкроек ещё нет. Загляните позже.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {patterns.map((pattern) => (
              <PatternCard
                key={pattern.id}
                pattern={pattern}
                categoryTitle={categoryTitles.get(pattern.categorySlug) ?? ""}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
