"use client";

import Link from "next/link";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { useCart } from "@/lib/cart/store";
import { formatPrice } from "@/lib/format";
import { validatePromoAction } from "@/lib/orders/actions";
import { cartSubtotal } from "@/lib/pricing";
import { cn } from "@/lib/utils";

interface AppliedPromo {
  code: string;
  discount: number;
  total: number;
  message: string;
}

/**
 * Оформление заказа (T-29, FR-5.2): сводка, промокод и переход к демо-оплате.
 * Промокод проверяет сервер — клиент не может сам назначить скидку.
 */
export function CheckoutView({ customerEmail }: { customerEmail: string }) {
  const items = useCart((state) => state.items);
  const hydrated = useCart((state) => state.hydrated);
  const [promo, setPromo] = useState("");
  const [applied, setApplied] = useState<AppliedPromo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = cartSubtotal(items);
  const total = applied?.total ?? subtotal;

  async function applyPromo() {
    if (busy || !promo.trim()) return;

    setBusy(true);
    setError(null);

    const result = await validatePromoAction(promo.trim(), subtotal);
    setBusy(false);

    if (result.status === "valid" && result.code) {
      setApplied({
        code: result.code,
        discount: result.discount,
        total: result.total,
        message: result.message,
      });
      return;
    }

    setApplied(null);
    setError(result.message);
  }

  if (!hydrated) {
    return <div className="h-40 animate-pulse rounded-3xl bg-secondary" aria-busy="true" />;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-card p-10 text-center">
        <p className="font-display text-2xl">Корзина пуста</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Добавьте выкройку в корзину, чтобы перейти к оформлению.
        </p>
        <Link href="/catalog" className={cn(buttonVariants({ size: "lg" }), "mt-5")}>
          В каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="space-y-4">
        <section
          aria-labelledby="checkout-items"
          className="rounded-3xl border border-line bg-card p-5"
        >
          <h2 id="checkout-items" className="font-display text-xl">
            Позиции
          </h2>
          <ul className="mt-3 divide-y divide-line/70">
            {items.map((item) => (
              <li key={item.key} className="flex flex-wrap justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Размер {item.sizeLabel} · {item.variantTitle}
                  </p>
                </div>
                <p className="font-display text-base">{formatPrice(item.price)}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Заказ оформляется на {customerEmail}. Мерки, сохранённые в профиле, сервер добавит в
            историю заказа.
          </p>
        </section>

        <section
          aria-labelledby="checkout-promo"
          className="rounded-3xl border border-line bg-card p-5"
        >
          <h2 id="checkout-promo" className="font-display text-xl">
            Промокод
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Демо-код из сида — <code className="rounded bg-secondary px-1.5 py-0.5">SEWIT10</code>.
          </p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <label htmlFor="promo" className="sr-only">
              Промокод
            </label>
            <input
              id="promo"
              value={promo}
              onChange={(event) => setPromo(event.target.value.toUpperCase())}
              placeholder="SEWIT10"
              autoComplete="off"
              className="h-11 w-full rounded-xl border border-line bg-background px-3.5 text-sm uppercase tracking-wide outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <button
              type="button"
              onClick={applyPromo}
              disabled={busy || !promo.trim()}
              className={cn(buttonVariants({ variant: "outline", size: "default" }), "shrink-0")}
            >
              {busy ? "Проверяем…" : "Применить"}
            </button>
          </div>

          {applied ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sage/30 bg-sage-soft p-3 text-sm text-sage">
              <span>{applied.message}</span>
              <button
                type="button"
                onClick={() => {
                  setApplied(null);
                  setPromo("");
                  setError(null);
                }}
                className="text-xs underline underline-offset-4"
              >
                Убрать
              </button>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </section>
      </div>

      <aside className="rounded-3xl border border-line bg-card p-5 lg:sticky lg:top-24">
        <h2 className="font-display text-xl">Сводка</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Сумма</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          {applied ? (
            <div className="flex justify-between gap-4 text-sage">
              <dt>Скидка</dt>
              <dd>−{formatPrice(applied.discount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4 border-t border-line/70 pt-2 text-base">
            <dt>К оплате</dt>
            <dd className="font-display text-2xl">{formatPrice(total)}</dd>
          </div>
        </dl>

        <Link
          href={
            applied
              ? `/checkout/payment?promo=${encodeURIComponent(applied.code)}`
              : "/checkout/payment"
          }
          className={cn(buttonVariants({ size: "lg" }), "mt-5 w-full justify-center")}
        >
          Перейти к оплате
        </Link>
        <Link
          href="/cart"
          className="mt-3 inline-flex text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Вернуться в корзину
        </Link>
      </aside>
    </div>
  );
}
