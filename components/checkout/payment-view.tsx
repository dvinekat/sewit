"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { useCart } from "@/lib/cart/store";
import { formatPrice } from "@/lib/format";
import { createOrderAction, validatePromoAction } from "@/lib/orders/actions";
import { cartSubtotal } from "@/lib/pricing";
import { cn } from "@/lib/utils";

type PromoState =
  | { status: "checking"; message: string }
  | { status: "valid"; message: string; code: string; discount: number; total: number }
  | { status: "invalid"; message: string; discount: 0; total: number };

function makeIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `order-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Демо-оплата (T-30, T-31, FR-5.3–5.5).
 *
 * Дисклеймер виден до кнопки. Повторный клик защищён idempotency key, а состав
 * и сумма ещё раз проверяются сервером; после успеха корзина очищается.
 */
export function PaymentView({ promoCode }: { promoCode?: string }) {
  const items = useCart((state) => state.items);
  const hydrated = useCart((state) => state.hydrated);
  const clear = useCart((state) => state.clear);
  const subtotal = cartSubtotal(items);

  const [promo, setPromo] = useState<PromoState | null>(() =>
    promoCode ? { status: "checking", message: "Проверяем промокод…" } : null,
  );
  const [idempotencyKey] = useState(makeIdempotencyKey);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!promoCode) return;

    let active = true;

    void validatePromoAction(promoCode, subtotal).then((result) => {
      if (!active) return;

      if (result.status === "valid" && result.code) {
        setPromo({
          status: "valid",
          message: result.message,
          code: result.code,
          discount: result.discount,
          total: result.total,
        });
        return;
      }

      setPromo({
        status: "invalid",
        message: result.message,
        discount: 0,
        total: subtotal,
      });
    });

    return () => {
      active = false;
    };
  }, [promoCode, subtotal]);

  const discount = promo?.status === "valid" ? promo.discount : 0;
  const total = promo?.status === "valid" ? promo.total : subtotal;
  const promoBlocked = promo?.status === "invalid" || promo?.status === "checking";

  async function pay() {
    if (paying || promoBlocked || items.length === 0) return;

    setPaying(true);
    setError(null);

    const result = await createOrderAction({
      items: items.map((item) => ({
        patternId: item.patternId,
        sizeLabel: item.sizeLabel,
        selection: item.selection,
      })),
      promoCode: promo?.status === "valid" ? promo.code : undefined,
      idempotencyKey,
    });

    if (result.status === "success" && result.orderId) {
      clear();
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- после оплаты нужен новый документ: корзина очищена, повторная отправка формы невозможна
      window.location.assign(`/checkout/success?order=${encodeURIComponent(result.orderId)}`);
      return;
    }

    setPaying(false);
    setError(result.message);
  }

  if (!hydrated) {
    return <div className="h-52 animate-pulse rounded-3xl bg-secondary" aria-busy="true" />;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-card p-10 text-center">
        <p className="font-display text-2xl">Корзина пуста</p>
        <p className="mt-2 text-sm text-muted-foreground">Сначала выберите выкройку.</p>
        <Link href="/catalog" className={cn(buttonVariants({ size: "lg" }), "mt-5")}>
          В каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="space-y-5">
        <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
          <p className="font-display text-lg">Тестовый платёж</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Это демонстрация: деньги не списываются, платёжная система не подключена. Кнопка ниже
            создаёт заказ со статусом «оплачен», чтобы показать библиотеку и историю покупок.
          </p>
        </div>

        <section
          aria-labelledby="payment-items"
          className="rounded-3xl border border-line bg-card p-5"
        >
          <h2 id="payment-items" className="font-display text-xl">
            Состав заказа
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
        </section>

        {promo ? (
          <p
            role="status"
            className={cn(
              "rounded-xl border px-4 py-3 text-sm",
              promo.status === "valid"
                ? "border-sage/30 bg-sage-soft text-sage"
                : promo.status === "invalid"
                  ? "border-destructive/30 bg-destructive/5 text-destructive"
                  : "border-line bg-secondary/50 text-muted-foreground",
            )}
          >
            {promo.message}
          </p>
        ) : null}

        {promoBlocked && promo?.status === "invalid" ? (
          <Link
            href="/checkout"
            className="inline-flex text-sm text-primary underline-offset-4 hover:underline"
          >
            Вернуться к оформлению и убрать промокод
          </Link>
        ) : null}
      </div>

      <aside className="rounded-3xl border border-line bg-card p-5 lg:sticky lg:top-24">
        <h2 className="font-display text-xl">К оплате</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Сумма</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          {discount > 0 ? (
            <div className="flex justify-between gap-4 text-sage">
              <dt>Скидка</dt>
              <dd>−{formatPrice(discount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4 border-t border-line/70 pt-2 text-base">
            <dt>Итого</dt>
            <dd className="font-display text-2xl">{formatPrice(total)}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={pay}
          disabled={paying || promoBlocked}
          className={cn(buttonVariants({ size: "lg" }), "mt-5 w-full justify-center")}
        >
          {paying ? "Создаём заказ…" : `Оплатить (демо) — ${formatPrice(total)}`}
        </button>

        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Нажимая кнопку, вы подтверждаете тестовую оплату. Повторное нажатие не создаст второй
          заказ.
        </p>

        {error ? (
          <p
            role="alert"
            className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}

        <Link
          href="/checkout"
          className="mt-3 inline-flex text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Назад к оформлению
        </Link>
      </aside>
    </div>
  );
}
