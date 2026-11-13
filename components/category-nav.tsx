import Link from "next/link";

import { catalogHref } from "@/lib/catalog";
import type { CategorySlug, CategoryWithCount } from "@/lib/patterns";
import { cn } from "@/lib/utils";

/** Категории каталога в виде ссылок с состоянием в URL (FR-1.2, FR-1.3). */
export function CategoryNav({
  categories,
  activeSlug,
}: {
  categories: CategoryWithCount[];
  activeSlug?: CategorySlug;
}) {
  const total = categories.reduce((sum, category) => sum + category.patternCount, 0);

  return (
    <nav aria-label="Категории выкроек" className="flex flex-wrap gap-2">
      <Link
        href={catalogHref()}
        aria-current={activeSlug ? undefined : "page"}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          activeSlug
            ? "border-line bg-card text-foreground hover:border-primary/40 hover:bg-secondary"
            : "border-primary bg-primary text-primary-foreground",
        )}
      >
        Все
        <span className="text-xs opacity-70">{total}</span>
      </Link>

      {categories.map((category) => {
        const active = category.slug === activeSlug;

        return (
          <Link
            key={category.slug}
            href={catalogHref(category.slug)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-line bg-card text-foreground hover:border-primary/40 hover:bg-secondary",
            )}
          >
            {category.title}
            <span className="text-xs opacity-70">{category.patternCount}</span>
          </Link>
        );
      })}
    </nav>
  );
}
