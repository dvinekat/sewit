import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { listMyLibrary } from "@/lib/downloads/library";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Мои выкройки",
  description: "Купленные лекала SewIt.",
  robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function LibraryPage() {
  await requireUser("/account/library");
  const items = await listMyLibrary();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Библиотека</p>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Мои выкройки</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Купленные лекала с выбранным размером и параметрами. Скачивать можно повторно — PDF
          формируется с титульным листом заказа.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-card p-10 text-center">
          <p className="font-display text-2xl">Библиотека пока пуста</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            После демо-оплаты купленная выкройка появится здесь вместе с размером и параметрами.
          </p>
          <Link href="/catalog" className={cn(buttonVariants({ size: "lg" }), "mt-5")}>
            Выбрать выкройку
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <li
              key={item.entitlementId}
              className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5"
            >
              <div>
                <Link
                  href={`/patterns/${item.slug}`}
                  className="font-display text-lg leading-tight underline-offset-4 hover:text-primary hover:underline"
                >
                  {item.title}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  Размер {item.sizeLabel} · {item.variantLabel}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Куплено {dateFormatter.format(new Date(item.grantedAt))}
                </p>
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-3">
                <a
                  href={`/api/download/${item.entitlementId}`}
                  className={cn(buttonVariants({ size: "sm" }), "gap-2")}
                  download
                >
                  Скачать PDF
                </a>
                <Link
                  href={`/patterns/${item.slug}`}
                  className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Открыть карточку
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
