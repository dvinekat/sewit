import type { Metadata } from "next";
import Link from "next/link";

import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { CategoryNav } from "@/components/category-nav";
import { PatternCard } from "@/components/pattern-card";
import {
  hasActiveFilters,
  parseCatalogQuery,
  selectPatterns,
  type CatalogSearchParams,
} from "@/lib/catalog";
import { formatPatternCount } from "@/lib/format";
import { listCategoriesWithCounts, listPublishedPatterns } from "@/lib/patterns";

export const metadata: Metadata = {
  title: "Каталог выкроек",
  description:
    "Каталог выкроек SewIt: платья, юбки, брюки, топы и верхняя одежда. Размеры 42, 46 и 50, лекала PDF A4. Фильтры по размеру, сложности и цене.",
  alternates: {
    canonical: "/catalog",
  },
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  const params = await searchParams;
  const query = parseCatalogQuery(params);

  const [patterns, categories] = await Promise.all([
    listPublishedPatterns(),
    listCategoriesWithCounts(),
  ]);

  const visible = selectPatterns(patterns, query);
  const categoryTitles = new Map(categories.map((category) => [category.slug, category.title]));
  const activeCategory = categories.find((category) => category.slug === query.category);
  const filtersActive = hasActiveFilters(query);

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
          {activeCategory ? activeCategory.title : "Все выкройки"}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          {activeCategory
            ? activeCategory.description
            : "Все модели SewIt. Фильтры и поиск сохраняются в ссылке — комбинацию можно сохранить или переслать."}
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-4 border-b border-line/70 pb-6">
        <CategoryNav categories={categories} activeSlug={query.category} query={query} />
        <p className="text-sm text-muted-foreground" role="status">
          {formatPatternCount(visible.length)}
          {filtersActive ? " по выбранным фильтрам" : ""}
        </p>
      </div>

      <div className="mt-6">
        <CatalogFilters query={query} />
      </div>

      {visible.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((pattern) => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              categoryTitle={categoryTitles.get(pattern.categorySlug) ?? ""}
            />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-card p-10 text-center">
          <p className="font-display text-2xl">
            {filtersActive ? "Ничего не нашлось" : "В этой категории пока пусто"}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {filtersActive
              ? "Попробуйте убрать часть фильтров или изменить поисковый запрос — поиск идёт по названию и описанию."
              : "Мы готовим новые модели. Загляните в другую категорию — остальные выкройки на месте."}
          </p>
          <Link
            href="/catalog"
            className="mt-5 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Сбросить фильтры
          </Link>
        </div>
      )}
    </div>
  );
}
