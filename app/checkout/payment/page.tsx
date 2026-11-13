import type { Metadata } from "next";
import Link from "next/link";

import { PaymentView } from "@/components/checkout/payment-view";
import { requireUser } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Демо-оплата",
  description: "Тестовый платёж SewIt: деньги не списываются.",
  robots: { index: false, follow: false },
};

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ promo?: string }>;
}) {
  await requireUser("/checkout/payment");
  const params = await searchParams;
  const promo =
    params.promo
      ?.trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, "")
      .slice(0, 40) || undefined;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <nav aria-label="Хлебные крошки" className="text-sm text-muted-foreground">
        <Link href="/checkout" className="transition-colors hover:text-foreground">
          Оформление
        </Link>
        <span aria-hidden="true" className="px-2 text-line">
          /
        </span>
        <span className="text-foreground">Оплата</span>
      </nav>

      <header className="mt-6 max-w-2xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Демо-оплата
        </p>
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Тестовый платёж</h1>
      </header>

      <div className="mt-8">
        <PaymentView promoCode={promo} />
      </div>
    </div>
  );
}
