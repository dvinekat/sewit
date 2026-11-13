"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { supabaseEnv } from "./env";

let browserClient: SupabaseClient | undefined;

/**
 * Клиент Supabase для браузера (T-02).
 * Использует только публичный ключ: доступ к данным ограничен RLS.
 */
export function createClient(): SupabaseClient {
  if (!browserClient) {
    const { url, anonKey } = supabaseEnv();
    browserClient = createBrowserClient(url, anonKey);
  }

  return browserClient;
}
