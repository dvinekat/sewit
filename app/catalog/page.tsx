import type { Metadata } from "next";
import Link from "next/link";

import { CategoryNav } from "@/components/category-nav";
import { PatternCard } from "@/components/pattern-card";
import { formatPatternCount } from "@/lib/format";
import { parseCategoryParam } from "@/lib/catalog";
import { listCategoriesWithCounts, listPatternsByCategory } from "@/lib/patterns";

export const metadata: Metadata = {
  title: "Каталог выкроек",
  description:
    "Каталог выкроек SewIt: платья, юбки, брюки, топы и верхняя одежда. Размеры 42, 46 и 50, лекала PDF A4.",
  alternates: {
    canonical: "/catalog",
  },
};

type CatalogSearchParams = {
  category?: string | string[];
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  const params = await searchParams;
  const activeCategory = parseCategoryParam(params.category);

  const [patterns, categories] = await Promise.all([
    listPatternsByCategory(activeCategory),
    listCategoriesWithCounts(),
  ]);

  const categoryTitles = new Map(categories.map((category) => [category.slug, category.title]));
  const activeCategoryData = categories.find((category) => category.slug === activeCategory);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <nav aria-label="Хлебные крошки" className="text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          Главная
        </Link>
        <span aria-hidden="true" className="px-2 text-line">
          /
        </span>
        <span className="text-foreground">Каталог</span>
      </nav>

      <header className="mt-6 max-w-2xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Каталог</p>
        <h1 className="font-display text-4xl tracking-tight text-balance sm:text-5xl">
          {activeCategoryData ? activeCategoryData.title : "Все выкройки"}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          {activeCategoryData
            ? activeCategoryData.description
            : "Все модели SewIt. Выберите категорию — фильтр сохранится в ссылке."}
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-4 border-b border-line/70 pb-6">
        <CategoryNav categories={categories} activeSlug={activeCategory} />
        <p className="text-sm text-muted-foreground" role="status">
          {formatPatternCount(patterns.length)}
        </p>
      </div>

      {patterns.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {patterns.map((pattern) => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              categoryTitle={categoryTitles.get(pattern.categorySlug) ?? ""}
            />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-card p-10 text-center">
          <p className="font-display text-2xl">В этой категории пока пусто</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Мы готовим новые модели. Сбросьте фильтр или загляните в другую категорию — остальные
            выкройки на месте.
          </p>
          <Link
            href="/catalog"
            className="mt-5 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Сбросить фильтр
          </Link>
        </div>
      )}
    </div>
  );
}
