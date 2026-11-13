import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Политика обработки персональных данных",
  description: "Какие данные SewIt собирает и как их удалить. Учебный проект.",
  alternates: { canonical: "/legal/privacy" },
};

/** Политика ПД для чекбокса согласия (FR-9.3, T-44). */
export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <nav aria-label="Хлебные крошки" className="text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          Главная
        </Link>
        <span aria-hidden="true" className="px-2 text-line">
          /
        </span>
        <span className="text-foreground">Политика обработки ПД</span>
      </nav>

      <header className="mt-6 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Правовая информация
        </p>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
          Политика обработки персональных данных
        </h1>
        <p className="text-sm text-muted-foreground">Документ обновлён 13 ноября 2026 года.</p>
      </header>

      <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed">
        <strong className="font-medium">SewIt — учебный проект.</strong> Сервис создан для
        демонстрации в рамках учебной работы, реального юридического лица нет. Платежи тестовые,
        деньги не списываются.
      </div>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-2">
          <h2 className="font-display text-xl text-foreground">1. Какие данные мы собираем</h2>
          <p>
            Только то, без чего работают кабинет и подбор размера: e-mail и пароль (хранится в виде
            хеша), имя, отметка о согласии на обработку данных, а также мерки — обхват груди, талии,
            бёдер и рост.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl text-foreground">2. Зачем они нужны</h2>
          <p>
            E-mail — для входа и восстановления пароля. Имя — для обращения в кабинете. Мерки — для
            рекомендации размера. Других целей нет: мы не отправляем рассылки и не передаём данные
            третьим лицам.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl text-foreground">3. Где хранятся данные</h2>
          <p>
            В защищённом хранилище Supabase (PostgreSQL и Auth). Доступ к строкам ограничен
            правилами RLS: каждый пользователь видит только свои мерки, заказы и избранное.
            Сторонней аналитики и рекламных трекеров на сайте нет.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl text-foreground">4. Ваши права</h2>
          <p>
            Вы можете изменить имя и мерки в профиле, а также удалить аккаунт. При удалении
            персональные данные стираются, а заказы остаются обезличенными, чтобы сохранилась
            финансовая история. По вопросам обработки данных пишите на{" "}
            <a
              href="mailto:privacy@sewit.example"
              className="text-primary underline-offset-4 hover:underline"
            >
              privacy@sewit.example
            </a>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl text-foreground">5. Cookie</h2>
          <p>
            Используются только технические cookie для входа и сохранения сессии. Они необходимы
            сайту и не служат для рекламы.
          </p>
        </section>
      </div>

      <div className="mt-10">
        <Link href="/register" className={buttonVariants({ variant: "outline" })}>
          Вернуться к регистрации
        </Link>
      </div>
    </div>
  );
}
