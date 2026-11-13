import { createClient } from "@supabase/supabase-js";

import { supabaseEnv } from "./env";

/**
 * Серверный клиент с service_role (README 8.7).
 *
 * Обходит RLS, поэтому используется только в серверных экшенах и route handlers:
 * создание заказа, entitlement'ов и проверка промокодов. В браузерный бандл
 * этот модуль попасть не должен — ключ читается из непубличной переменной.
 */

export function hasServiceRoleKey(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY не задан: серверные операции с заказами недоступны",
    );
  }

  const { url } = supabaseEnv();

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
