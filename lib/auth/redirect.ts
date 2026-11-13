/**
 * Безопасный `next` после входа (T-05).
 *
 * Принимаем только относительный путь внутри сайта: открытые редиректы
 * (`//evil.example`, `https://evil.example`, `\\evil.example`) отбрасываем.
 */
export function safeNextPath(value: string | null | undefined, fallback = "/account"): string {
  if (!value) return fallback;

  const trimmed = value.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return fallback;
  }

  return trimmed;
}
