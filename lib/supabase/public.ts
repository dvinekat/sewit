import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { supabaseEnv } from "./env";

/**
 * Клиент только для публичного чтения каталога (T-02, T-04).
 *
 * Не трогает cookie, поэтому страницы с ISR остаются статическими, а запрос
 * не требует сессии. Всё, что зависит от пользователя (заказы, права, профиль),
 * идёт через `lib/supabase/server.ts`.
 */
export function createPublicClient() {
  const { url, anonKey } = supabaseEnv();

  return createSupabaseClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
