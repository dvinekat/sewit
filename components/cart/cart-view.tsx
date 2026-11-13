"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { useCart } from "@/lib/cart/store";
import { formatPrice } from "@/lib/format";
import { cartSubtotal } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/** Содержимое корзины (T-28, FR-5.1): позиции, удаление, итог, переход к оформлению. */
export function CartView() {
  const items = useCart((state) => state.items);
  const hydrated = useCart((state) => state.hydrated);
  const removeItem = useCart((state) => state.removeItem);

  if (!hydrated) {
    return (
      <div className="space-y-3" aria-busy="true">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl bg-secondary" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-card p-10 text-center">
        <p className="font-display text-2xl">В корзине пока пусто</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Выберите выкройку, размер и параметры — позиция сохранится между заходами и не потеряется
          после закрытия браузера.
        </p>
        <Link href="/catalog" className={cn(buttonVariants({ size: "lg" }), "mt-5")}>
          Перейти в каталог
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(items);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.key}
            className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-line bg-card p-4 sm:p-5"
          >
            <div className="min-w-0">
              <Link
                href={`/patterns/${item.slug}`}
                className="font-display text-lg leading-tight text-foreground underline-offset-4 hover:text-primary hover:underline"
              >
                {item.title}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                Размер {item.sizeLabel} · {item.variantTitle}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Лекала PDF A4, скачивание в ЛК</p>
            </div>

            <div className="flex items-center gap-3">
              <p className="font-display text-lg">{formatPrice(item.price)}</p>
              <button
                type="button"
                onClick={() => removeItem(item.key)}
                aria-label={`Удалить ${item.title} из корзины`}
                className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <aside className="rounded-3xl border border-line bg-card p-5 lg:sticky lg:top-24">
        <h2 className="font-display text-xl">Итого</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Позиции</dt>
            <dd>{items.length}</dd>
          </div>
          <div className="flex justify-between gap-4 text-base">
            <dt>Сумма</dt>
            <dd className="font-display text-xl">{formatPrice(subtotal)}</dd>
          </div>
        </dl>

        <Link
          href="/checkout"
          className={cn(buttonVariants({ size: "lg" }), "mt-5 w-full justify-center")}
        >
          Оформить заказ
        </Link>

        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          На следующем шаге можно применить промокод. Оплата демонстрационная — деньги не
          списываются.
        </p>
        <Link
          href="/catalog"
          className="mt-3 inline-flex text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Продолжить покупки
        </Link>
      </aside>
    </div>
  );
}
