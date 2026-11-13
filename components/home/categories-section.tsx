import { CategoryNav } from "@/components/category-nav";
import { SectionHeading } from "@/components/section-heading";
import type { CategoryWithCount } from "@/lib/patterns";

export function CategoriesSection({ categories }: { categories: CategoryWithCount[] }) {
  return (
    <section aria-labelledby="categories-title" className="border-b border-line/70">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <SectionHeading
          id="categories-title"
          eyebrow="Категории"
          title="Что будем шить?"
          description="Пять категорий. Выбор сохраняется в ссылке — фильтром можно поделиться."
        />
        <div className="mt-8">
          <CategoryNav categories={categories} />
        </div>
      </div>
    </section>
  );
}
