import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/logo";

/**
 * Общая рамка страниц входа, регистрации и сброса пароля (T-05).
 * Карточка по центру, на широком экране — пояснение слева, чтобы страница
 * не выглядела пустой (T-07, адаптив 360–1440).
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
      <aside className="hidden lg:block">
        <Logo />
        <h2 className="mt-8 max-w-sm font-display text-4xl leading-tight tracking-tight text-balance">
          Выкройки, которые садятся по вашей фигуре
        </h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Сохраните мерки один раз — SewIt подскажет размер для каждой модели, а купленные лекала
          будут ждать в личном кабинете.
        </p>
        <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
          {[
            "Подбор размера по ОГ, ОТ, ОБ и росту",
            "Лекала PDF A4 с припусками на швы",
            "Избранное и библиотека покупок",
          ].map((item) => (
            <li key={item} className="flex gap-2.5">
              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </aside>

      <div className="w-full justify-self-center rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-3xl tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>

        <div className="mt-6">{children}</div>

        {footer ? (
          <div className="mt-6 border-t border-line/70 pt-4 text-sm text-muted-foreground">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Ссылка в тексте формы. */
export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="font-medium text-primary underline-offset-4 transition-colors hover:underline"
    >
      {children}
    </Link>
  );
}
