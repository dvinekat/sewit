import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PatternDeleteButton } from "@/components/admin/pattern-delete-button";
import { PatternForm } from "@/components/admin/pattern-form";
import { Badge } from "@/components/ui/badge";
import {
  getAdminPattern,
  listAdminCategories,
  patternFormValues,
} from "@/lib/admin/pattern-queries";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Выкройка",
  robots: { index: false, follow: false },
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** Редактирование выкройки: форма, загрузка файлов и удаление (T-39). */
export default async function AdminPatternEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();

  const { id } = await params;

  if (!UUID_PATTERN.test(id)) notFound();

  const pattern = await getAdminPattern(id);
  if (!pattern) notFound();

  const categories = await listAdminCategories();
  const query = await searchParams;
  const blocked = Array.isArray(query.blocked) ? query.blocked[0] : query.blocked;
  const saved = Boolean(query.saved);
  const ordersError = Boolean(query.error);

  return (
    <div className="space-y-6">
      <nav aria-label="Хлебные крошки" className="text-sm text-muted-foreground">
        <Link href="/admin/patterns" className="transition-colors hover:text-foreground">
          Выкройки
        </Link>
        <span aria-hidden="true" className="px-2 text-line">
          /
        </span>
        <span className="text-foreground">{pattern.title}</span>
      </nav>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Выкройка</p>
          <Badge variant={pattern.status === "published" ? "sage" : "outline"}>
            {pattern.status === "published" ? "Опубликована" : "Черновик"}
          </Badge>
        </div>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{pattern.title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {pattern.categoryTitle} · размеров {pattern.sizesCount}, с PDF {pattern.sizesWithFiles} ·
          продаж {pattern.salesCount} · создана {dateFormatter.format(new Date(pattern.createdAt))}
        </p>
      </header>

      {saved ? (
        <p
          role="status"
          className="rounded-xl border border-sage/30 bg-sage-soft px-4 py-3 text-sm text-sage"
        >
          Выкройка сохранена.
        </p>
      ) : null}

      {blocked ? (
        <p
          role="alert"
          className="rounded-xl border border-primary/30 bg-secondary/60 px-4 py-3 text-sm leading-relaxed"
        >
          Сохранено как черновик: публикация невозможна, пока не исправлено — {blocked}.
        </p>
      ) : null}

      {ordersError ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          Выкройку покупали — удалить её нельзя, иначе покупатели потеряют доступ к PDF. Снимите
          выкройку с публикации: она станет черновиком и исчезнет из каталога.
        </p>
      ) : null}

      <PatternForm initial={patternFormValues(pattern)} categories={categories} />

      <section
        aria-labelledby="delete-pattern"
        className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5"
      >
        <h2 id="delete-pattern" className="font-display text-xl text-destructive">
          Удаление
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Удаляются карточка, размеры, параметры и все PDF из Storage. Выкройки с покупками удалить
          нельзя — снимите их с публикации.
        </p>
        <PatternDeleteButton id={pattern.id} disabled={pattern.salesCount > 0} />
      </section>
    </div>
  );
}
