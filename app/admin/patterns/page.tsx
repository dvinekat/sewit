import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { listAdminPatterns } from "@/lib/admin/pattern-queries";
import { requireAdmin } from "@/lib/auth/guards";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Выкройки",
  robots: { index: false, follow: false },
};

const NOTICES: Record<string, string> = {
  deleted: "Выкройка удалена вместе с файлами.",
  error: "Не удалось удалить выкройку: повторите попытку.",
};

const inputClass =
  "h-10 w-full rounded-xl border border-line bg-background px-3 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40";

function parseStatus(value: string | string[] | undefined): "all" | "draft" | "published" {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "draft" || raw === "published" ? raw : "all";
}

/**
 * Список выкроек для админки (T-39, FR-8.2).
 *
 * Черновики видны только администратору: видимость строк задаёт RLS, а не
 * фильтр в запросе. Счётчик PDF приходит из `pattern_files` через service_role —
 * у клиента доступа к этой таблице нет по дизайну (T-35).
 */
export default async function AdminPatternsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const status = parseStatus(params.status);
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const q = rawQuery?.trim().slice(0, 60) || null;
  const patterns = await listAdminPatterns({ status, q });
  const noticeKey = ["deleted", "error"].find((key) => Boolean(params[key]));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Выкройки</p>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Каталог</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Черновики не видны покупателям. Публикация требует обложку, таблицу размеров и PDF на
            каждый размер.
          </p>
        </div>

        <Link href="/admin/patterns/new" className={cn(buttonVariants({ size: "default" }))}>
          Новая выкройка
        </Link>
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
          {NOTICES[noticeKey]}
        </p>
      ) : null}

      <form
        method="get"
        className="grid gap-3 rounded-2xl border border-line bg-card p-4 sm:grid-cols-[1fr_180px_auto] sm:items-end"
      >
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Название</span>
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Платье"
            className={cn(inputClass, "mt-1")}
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Статус</span>
          <select name="status" defaultValue={status} className={cn(inputClass, "mt-1")}>
            <option value="all">Все</option>
            <option value="published">Опубликованы</option>
            <option value="draft">Черновики</option>
          </select>
        </label>

        <div className="flex items-center gap-2">
          <button type="submit" className={cn(buttonVariants({ size: "sm" }), "h-10")}>
            Показать
          </button>
          <Link
            href="/admin/patterns"
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Сбросить
          </Link>
        </div>
      </form>

      {patterns.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-card p-6 text-sm leading-relaxed text-muted-foreground">
          {q || status !== "all"
            ? "По этим условиям выкроек нет. Сбросьте фильтры или создайте новую."
            : "В каталоге пока пусто: создайте первую выкройку."}
        </p>
      ) : (
        <section
          aria-labelledby="patterns-table"
          className="rounded-2xl border border-line bg-card"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 px-4 py-3">
            <h2 id="patterns-table" className="font-display text-lg">
              Найдено: {patterns.length}
            </h2>
            <p className="text-xs text-muted-foreground">Сначала новые</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="px-4 py-2 font-medium">
                    Выкройка
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Категория
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Цена
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Статус
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Размеры
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    PDF
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Продажи
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {patterns.map((pattern) => (
                  <tr key={pattern.id} className="transition-colors hover:bg-secondary/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/patterns/${pattern.id}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {pattern.title}
                      </Link>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        /patterns/{pattern.slug}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{pattern.categoryTitle}</td>
                    <td className="px-4 py-3 font-display">{formatPrice(pattern.price)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={pattern.status === "published" ? "sage" : "outline"}>
                        {pattern.status === "published" ? "Опубликована" : "Черновик"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{pattern.sizesCount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          pattern.sizesCount > 0 && pattern.filesCount >= pattern.sizesCount
                            ? "text-sage"
                            : "text-destructive"
                        }
                      >
                        {pattern.filesCount} / {pattern.sizesCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{pattern.salesCount}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/patterns/${pattern.id}`}
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
        </section>
      )}
    </div>
  );
}
