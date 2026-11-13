import type { Metadata } from "next";
import Link from "next/link";

import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = {
  title: "Корзина",
  description: "Выбранные выкройки SewIt.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <nav aria-label="Хлебные крошки" className="text-sm text-muted-foreground">
        <Link href="/catalog" className="transition-colors hover:text-foreground">
          Каталог
        </Link>
        <span aria-hidden="true" className="px-2 text-line">
          /
        </span>
        <span className="text-foreground">Корзина</span>
      </nav>

      <header className="mt-6 max-w-2xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Корзина</p>
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Ваши выкройки</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Позиции хранятся в браузере: можно закрыть вкладку и вернуться позже. Размер и параметры
          сохраняются вместе с выкройкой.
        </p>
      </header>

      <div className="mt-8">
        <CartView />
      </div>
    </div>
  );
}
