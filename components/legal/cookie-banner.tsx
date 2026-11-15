"use client";

import Link from "next/link";
import { useSyncExternalStore, useState } from "react";

import { COOKIE_CONSENT_KEY, COOKIE_CONSENT_VALUE, hasCookieConsent } from "@/lib/cookie-consent";

/** Внешних событий нет: отметка меняется только этой кнопкой. */
function subscribe(): () => void {
  return () => {};
}

function getSnapshot(): boolean {
  try {
    return hasCookieConsent(window.localStorage.getItem(COOKIE_CONSENT_KEY));
  } catch {
    // Приватный режим может запрещать localStorage — считаем, что согласия нет.
    return false;
  }
}

/** На сервере баннер не рендерим: localStorage доступен только в браузере. */
function getServerSnapshot(): boolean {
  return true;
}

/**
 * Cookie-баннер (T-44, FR-9.3).
 *
 * `useSyncExternalStore` читает localStorage без setState в эффекте: сервер
 * рендерит страницу без баннера, а после гидратации React подставляет
 * настоящее значение без рассинхрона разметки.
 */
export function CookieBanner() {
  const consented = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [acceptedNow, setAcceptedNow] = useState(false);

  if (consented || acceptedNow) return null;

  function accept() {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, COOKIE_CONSENT_VALUE);
    } catch {
      // Сохранить не удалось, но в пределах страницы баннер больше не мешает.
    }

    setAcceptedNow(true);
  }

  return (
    <div
      role="dialog"
      aria-label="Использование cookie"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-2xl border border-line bg-card p-4 shadow-lg sm:inset-x-6 sm:p-5 print:hidden"
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
