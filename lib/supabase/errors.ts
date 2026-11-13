/**
 * PostgrestError — не экземпляр Error, а обычный объект { code, message, details, hint },
 * поэтому `error instanceof Error` даёт «[object Object]» в интерфейсе.
 */
export function describeSupabaseError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const { code, message } = error as { code?: string; message?: unknown };
    const text = String(message);

    if (code === "PGRST205") {
      return `${text}. Таблиц нет: примените миграцию из supabase/migrations в SQL Editor.`;
    }

    return text;
  }

  return String(error);
}
