"use client";

import Link from "next/link";
import { useState } from "react";

import { COOKIE_CONSENT_KEY, COOKIE_CONSENT_VALUE } from "@/lib/cookie-consent";

/**
 * Cookie-баннер (T-44, FR-9.3).
 *
 * Баннер входит в серверный HTML, а не появляется после гидратации: это лучший
 * LCP на мобильном (Lighthouse ставил задержку отрисовки 2,2 с именно баннеру).
 * Тем, кто уже принял условия, его прячет ещё до первой отрисовки инлайн-скрипт
 * в `app/layout.tsx` — он ставит `data-cookie-consent` на `<html>`, правило
 * в `globals.css` скрывает блок. Поэтому вспышки баннера при повторных заходах нет.
 */
export function CookieBanner() {
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  function accept() {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, COOKIE_CONSENT_VALUE);
      document.documentElement.dataset.cookieConsent = COOKIE_CONSENT_VALUE;
    } catch {
      // Приватный режим может запрещать localStorage — в пределах страницы
      // баннер всё равно закрывается.
    }

    setHidden(true);
  }

  return (
    <div
      role="dialog"
      aria-label="Использование cookie"
      className="cookie-banner fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-2xl border border-line bg-card p-4 shadow-lg sm:inset-x-6 sm:p-5 print:hidden"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-muted-foreground">
          SewIt использует только технические cookie: вход и сессия. Аналитики, рекламных трекеров и
          передачи данных третьим лицам нет.{" "}
          <Link href="/legal/privacy" className="text-primary underline-offset-4 hover:underline">
            Подробнее в политике ПД
          </Link>
          .
        </p>

        <button
          type="button"
          onClick={accept}
          className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Понятно
        </button>
      </div>
    </div>
  );
}
