/**
 * Согласие на технические cookie (T-44, FR-9.3).
 *
 * Сторонней аналитики на сайте нет, поэтому «согласие» — это просто отметка
 * «баннер закрыт», а не переключатель трекеров. Хранится в localStorage:
 * сервер о ней ничего не знает, и это осознанно — лишняя cookie не нужна.
 */
export const COOKIE_CONSENT_KEY = "sewit-cookie-consent";
export const COOKIE_CONSENT_VALUE = "accepted";

export function hasCookieConsent(value: string | null | undefined): boolean {
  return value === COOKIE_CONSENT_VALUE;
}
