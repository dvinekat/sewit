import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PromoForm } from "@/components/admin/promo-form";
import { Badge } from "@/components/ui/badge";
import { promoFormValuesFrom } from "@/lib/admin/promo-form";
import { getPromo } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Промокод",
  robots: { index: false, follow: false },
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** Редактирование промокода (T-42, FR-8.6). */
export default async function AdminPromoEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  if (!UUID_PATTERN.test(id)) notFound();

  const promo = await getPromo(id);
  if (!promo) notFound();

  return (
    <div className="space-y-6">
      <nav aria-label="Хлебные крошки" className="text-sm text-muted-foreground">
        <Link href="/admin/promo" className="transition-colors hover:text-foreground">
          Промокоды
        </Link>
        <span aria-hidden="true" className="px-2 text-line">
          /
        </span>
        <span className="text-foreground">{promo.code}</span>
      </nav>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Промокод</p>
          <Badge variant={promo.active ? "sage" : "outline"}>
            {promo.active ? "активен" : "выключен"}
          </Badge>
        </div>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{promo.code}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Использован {promo.usedCount} из {promo.maxUses} раз · создан{" "}
          {dateFormatter.format(new Date(promo.createdAt))} ·{" "}
          {promo.expiresAt
            ? `действует до ${dateFormatter.format(new Date(promo.expiresAt))}`
            : "без срока действия"}
          .
        </p>
      </header>

      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="font-display text-xl">Параметры</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Снижение лимита ниже уже использованного числа раз запрещено: иначе история покупок
          разойдётся со счётчиком.
        </p>
        <PromoForm mode="edit" initial={promoFormValuesFrom(promo)} />
      </section>
    </div>
  );
}
