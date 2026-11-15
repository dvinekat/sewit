import type { Metadata } from "next";

import { PatternForm } from "@/components/admin/pattern-form";
import { emptyPatternFormValues, listAdminCategories } from "@/lib/admin/pattern-queries";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Новая выкройка",
  robots: { index: false, follow: false },
};

/** Создание выкройки (T-39): форма всегда стартует с черновика. */
export default async function AdminPatternNewPage() {
  await requireAdmin();

  const categories = await listAdminCategories();

  if (categories.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl tracking-tight">Новая выкройка</h1>
        <p className="rounded-2xl border border-dashed border-line bg-card p-6 text-sm leading-relaxed text-muted-foreground">
          Сначала нужна хотя бы одна категория каталога. Раздел категорий появится в следующем шаге
          админки — пока добавьте строку в таблицу `categories` через Supabase.
        </p>
      </div>
    );
  }

  const initial = emptyPatternFormValues(categories[0]!.id);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Выкройки</p>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Новая выкройка</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Сохраните черновик полей, затем загрузите обложку и PDF по размерам. Опубликовать можно
          только готовую выкройку.
        </p>
      </header>

      <PatternForm initial={initial} categories={categories} />
    </div>
  );
}
