import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Админка",
  description: "Служебный раздел SewIt.",
  robots: { index: false, follow: false },
};

const numberFormatter = new Intl.NumberFormat("ru-RU");

/**
 * Каркас админки (T-06 → T-38).
 *
 * Доступ проверяют proxy и `requireAdmin`: обычный пользователь сюда не попадёт
 * даже по прямой ссылке. Наполнение (CRUD выкроек, заказов, промокодов) —
 * задачи T-39…T-42.
 */
export default async function AdminPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const [published, drafts, orders] = await Promise.all([
    supabase
      .from("patterns")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase.from("patterns").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("orders").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Опубликовано выкроек", value: published.count ?? 0 },
    { label: "Черновиков", value: drafts.count ?? 0 },
    { label: "Заказов", value: orders.count ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Админка</p>
          <Badge variant="sage">роль admin</Badge>
        </div>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Служебный раздел</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Вы вошли как {admin.email}. Управление каталогом, заказами и промокодами появится
          следующими шагами — каркас и защита роли уже работают.
        </p>
      </header>

      <dl className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-line bg-card p-5">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</dt>
            <dd className="mt-2 font-display text-3xl">{numberFormatter.format(stat.value)}</dd>
          </div>
        ))}
      </dl>

      <section className="rounded-2xl border border-line bg-card p-6">
        <h2 className="font-display text-xl">Что уже проверяется</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>• Анонимный пользователь уходит на страницу входа, а не видит админку.</li>
          <li>• Покупатель без роли admin получает редирект в кабинет с пояснением.</li>
          <li>• Счётчики читаются через RLS: черновики видны только администратору.</li>
        </ul>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/catalog" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Каталог на сайте
          </Link>
          <Link href="/account" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Вернуться в кабинет
          </Link>
        </div>
      </section>
    </div>
  );
}
