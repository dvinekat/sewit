import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { countFavorites } from "@/lib/favorites";
import { formatPatternCount } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Личный кабинет",
  description: "Профиль, мерки и избранное в SewIt.",
  robots: { index: false, follow: false },
};

interface MeasurementRow {
  bust: number | string;
  waist: number | string;
  hips: number | string;
  height: number | string;
  updated_at: string;
}

const measureFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });
const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const NOTICES: Record<string, string> = {
  welcome: "Аккаунт создан. Добро пожаловать в SewIt!",
  password: "Пароль обновлён. Используйте его при следующем входе.",
  denied: "В админку нельзя: у вашего аккаунта нет роли администратора.",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; password?: string; denied?: string }>;
}) {
  const params = await searchParams;
  const user = await requireUser("/account");
  const supabase = await createClient();

  const [{ data: measurements }, favorites] = await Promise.all([
    supabase
      .from("measurements")
      .select("bust, waist, hips, height, updated_at")
      .eq("user_id", user.id)
      .maybeSingle<MeasurementRow>(),
    countFavorites(),
  ]);

  const noticeKey = params.welcome
    ? "welcome"
    : params.password
      ? "password"
      : params.denied
        ? "denied"
        : undefined;
  const notice = noticeKey ? NOTICES[noticeKey] : undefined;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Кабинет</p>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
          Здравствуйте, {user.name ?? "покупатель"}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Здесь собрано всё, что нужно для пошива: профиль, мерки и сохранённые выкройки.
        </p>
      </header>

      {notice ? (
        <p
          role="status"
          className={cn(
            "rounded-xl border px-4 py-3 text-sm leading-relaxed",
            noticeKey === "denied"
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : "border-sage/30 bg-sage-soft text-sage",
          )}
        >
          {notice}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <section
          aria-labelledby="profile-title"
          className="rounded-2xl border border-line bg-card p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="profile-title" className="font-display text-xl">
              Профиль
            </h2>
            {user.role === "admin" ? <Badge variant="sage">admin</Badge> : null}
          </div>

          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Имя</dt>
              <dd className="mt-0.5 font-medium">{user.name ?? "Не указано"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">E-mail</dt>
              <dd className="mt-0.5 break-all font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Дата регистрации</dt>
              <dd className="mt-0.5 font-medium">
                {user.createdAt ? dateFormatter.format(new Date(user.createdAt)) : "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section
          aria-labelledby="measurements-title"
          className="rounded-2xl border border-line bg-card p-5"
        >
          <h2 id="measurements-title" className="font-display text-xl">
            Мерки
          </h2>

          {measurements ? (
            <>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "ОГ", value: measurements.bust },
                  { label: "ОТ", value: measurements.waist },
                  { label: "ОБ", value: measurements.hips },
                  { label: "Рост", value: measurements.height },
                ].map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs text-muted-foreground">{item.label}</dt>
                    <dd className="mt-0.5 font-display text-xl">
                      {measureFormatter.format(Number(item.value))} см
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                Обновлены {dateFormatter.format(new Date(measurements.updated_at))}.
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Сохранённых мерок пока нет. Подберите размер в карточке выкройки — SewIt подскажет его
              по ОГ, ОТ, ОБ и росту.
            </p>
          )}
        </section>

        <section
          aria-labelledby="favorites-title"
          className="rounded-2xl border border-line bg-card p-5"
        >
          <h2 id="favorites-title" className="font-display text-xl">
            Избранное
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {favorites > 0
              ? `${formatPatternCount(favorites)} ждут в избранном.`
              : "Пока пусто: отмечайте выкройки сердечком в карточке."}
          </p>
          <Link
            href="/account/favorites"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}
          >
            Открыть избранное
          </Link>
        </section>

        <section
          aria-labelledby="orders-title"
          className="rounded-2xl border border-line bg-card p-5"
        >
          <h2 id="orders-title" className="font-display text-xl">
            Заказы и библиотека
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Здесь появятся история покупок и скачивание лекал: после демо-оплаты заказ и PDF сразу
            станут доступны.
          </p>
          {user.role === "admin" ? (
            <Link
              href="/admin"
              className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-4")}
            >
              Перейти в админку
            </Link>
          ) : null}
        </section>
      </div>
    </div>
  );
}
