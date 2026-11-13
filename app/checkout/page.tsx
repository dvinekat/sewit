import type { Metadata } from "next";
import Link from "next/link";

import { CheckoutView } from "@/components/checkout/checkout-view";
import { requireUser } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Оформление заказа",
  description: "Сводка заказа и промокод в SewIt.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <nav aria-label="Хлебные крошки" className="text-sm text-muted-foreground">
        <Link href="/cart" className="transition-colors hover:text-foreground">
          Корзина
        </Link>
        <span aria-hidden="true" className="px-2 text-line">
          /
        </span>
        <span className="text-foreground">Оформление</span>
      </nav>

      <header className="mt-6 max-w-2xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Оформление</p>
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Проверьте заказ</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Сумма и скидка пересчитываются на сервере при оплате — цены берутся из базы, а не из
          корзины.
        </p>
      </header>

      <div className="mt-8">
        <CheckoutView customerEmail={user.email} />
      </div>
    </div>
  );
}
