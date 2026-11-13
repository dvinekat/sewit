import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabaseEnv } from "./env";

/**
 * Клиент Supabase для сервера: читает и обновляет сессию из cookie (T-02).
 *
 * В Server Component запись cookie запрещена — такие вызовы молча пропускаются,
 * а сессию обновляет `proxy.ts` на каждом запросе.
 */
export async function createClient() {
  const { url, anonKey } = supabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component не может писать cookie — это делает proxy.
        }
      },
    },
  });
}
