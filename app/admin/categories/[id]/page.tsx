import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CategoryForm } from "@/components/admin/category-form";
import { CategoryDeleteButton } from "@/components/admin/category-delete-button";
import { getAdminCategory } from "@/lib/admin/category-queries";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Категория",
  robots: { index: false, follow: false },
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Редактирование и удаление категории (T-40, FR-8.3). */
export default async function AdminCategoryEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();

  const { id } = await params;

  if (!UUID_PATTERN.test(id)) notFound();

  const category = await getAdminCategory(id);
  if (!category) notFound();

  const query = await searchParams;
  const saved = Boolean(query.saved);
  const patternsError = Boolean(query.error);

  return (
    <div className="space-y-6">
      <nav aria-label="Хлебные крошки" className="text-sm text-muted-foreground">
        <Link href="/admin/categories" className="transition-colors hover:text-foreground">
          Категории
        </Link>
        <span aria-hidden="true" className="px-2 text-line">
          /
        </span>
        <span className="text-foreground">{category.title}</span>
      </nav>

      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Категория</p>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{category.title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Выкроек: {category.patternCount} (опубликовано {category.publishedCount}) · порядок{" "}
          {category.sort} · адрес фильтра /catalog?category={category.slug}
        </p>
      </header>

      {saved ? (
        <p
          role="status"
          className="rounded-xl border border-sage/30 bg-sage-soft px-4 py-3 text-sm text-sage"
        >
          Категория сохранена.
        </p>
      ) : null}

      {patternsError ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          В категории есть выкройки — удалить её нельзя. Перенесите выкройки в другую категорию.
        </p>
      ) : null}

      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="font-display text-xl">Параметры</h2>
        <CategoryForm
          mode="edit"
          initial={{
            id: category.id,
            slug: category.slug,
            title: category.title,
            sort: String(category.sort),
          }}
        />
      </section>

      <section
        aria-labelledby="delete-category"
        className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5"
      >
        <h2 id="delete-category" className="font-display text-xl text-destructive">
          Удаление
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Категория исчезнет из навигации каталога. Удалить можно только пустую: выкройки без
          категории остаться не должны.
        </p>
        <CategoryDeleteButton id={category.id} patternCount={category.patternCount} />
      </section>
    </div>
  );
}
