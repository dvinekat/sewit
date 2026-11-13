import type { Metadata } from "next";
import Link from "next/link";

import { PatternCard } from "@/components/pattern-card";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { listFavoritePatterns } from "@/lib/favorites";
import { formatPatternCount } from "@/lib/format";
import { CATEGORY_TITLES } from "@/lib/pattern-domain";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Избранное",
  description: "Сохранённые выкройки SewIt.",
  robots: { index: false, follow: false },
};

export default async function FavoritesPage() {
  await requireUser("/account/favorites");
  const patterns = await listFavoritePatterns();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Избранное
          </p>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Сохранённые выкройки</h1>
        </div>
        <p className="text-sm text-muted-foreground" role="status">
          {patterns.length > 0 ? formatPatternCount(patterns.length) : "Пока пусто"}
        </p>
      </header>

      {patterns.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {patterns.map((pattern) => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              categoryTitle={CATEGORY_TITLES[pattern.categorySlug]}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-card p-10 text-center">
          <p className="font-display text-2xl">Здесь будут любимые выкройки</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Откройте каталог и нажмите «В избранное» в карточке — выкройка появится тут и останется
            после выхода из аккаунта.
          </p>
          <Link href="/catalog" className={cn(buttonVariants({ size: "lg" }), "mt-5")}>
            Перейти в каталог
          </Link>
        </div>
      )}
    </div>
  );
}
