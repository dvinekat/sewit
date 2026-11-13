/**
 * Публичные переменные Supabase.
 *
 * Одна точка чтения NEXT_PUBLIC_*: если .env.local не заполнен, ошибка будет
 * понятной, а не «supabaseUrl is required» из недр библиотеки.
 */
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase не настроен: заполните NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY в .env.local",
    );
  }

  return { url, anonKey };
}

/** Проверка без исключения — для страниц и proxy, которые должны работать и без БД. */
export function hasSupabaseEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
