import type { Metadata } from "next";
import Link from "next/link";

import { CategoryForm } from "@/components/admin/category-form";
import { listAdminCategoriesWithCounts } from "@/lib/admin/category-queries";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Категории",
  robots: { index: false, follow: false },
};

const NOTICES: Record<string, string> = {
  deleted: "Категория удалена.",
  error: "Не удалось удалить категорию: повторите попытку.",
};

/**
 * Категории каталога (T-40, FR-8.3).
 *
 * Новая категория сразу появляется в навигации витрины: каталог читает
 * категории из БД, а slug проверяется той же схемой, что и в форме.
 */
export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const categories = await listAdminCategoriesWithCounts();
  const created = Array.isArray(params.created) ? params.created[0] : params.created;
  const noticeKey = created ? "created" : ["deleted", "error"].find((key) => Boolean(params[key]));
  const nextSort = categories.reduce((max, category) => Math.max(max, category.sort), 0) + 1;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Категории</p>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Разделы каталога</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Категории показываются в навигации витрины в порядке поля «Порядок». Удалить можно только
          пустую категорию — выкройки не должны оставаться без раздела.
        </p>
      </header>

      {noticeKey ? (
        <p
          role="status"
          className={
            noticeKey === "error"
              ? "rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              : "rounded-xl border border-sage/30 bg-sage-soft px-4 py-3 text-sm text-sage"
          }
        >
          {created ? `Категория «${created}» создана.` : NOTICES[noticeKey]}
        </p>
      ) : null}

      <section
        aria-labelledby="category-create"
        className="rounded-2xl border border-line bg-card p-5"
      >
        <h2 id="category-create" className="font-display text-xl">
          Новая категория
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Slug входит в адрес фильтра и должен быть латиницей: dresses-kids, homewear.
        </p>
        <CategoryForm mode="create" initial={{ slug: "", title: "", sort: String(nextSort) }} />
      </section>

      <section
        aria-labelledby="category-list"
        className="rounded-2xl border border-line bg-card p-5"
      >
        <h2 id="category-list" className="font-display text-xl">
          Все категории
        </h2>

        {categories.length === 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Категорий пока нет: создайте первую, иначе выкройку не к чему привязать.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Название
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Slug
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Порядок
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Выкроек
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="py-3 pr-3 font-medium">{category.title}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{category.slug}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{category.sort}</td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {category.publishedCount} / {category.patternCount}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/admin/categories/${category.id}`}
                        className="rounded-full px-2.5 py-1 text-xs text-muted-foreground underline-offset-4 transition-colors hover:bg-secondary hover:text-foreground hover:underline"
                      >
                        Изменить
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
