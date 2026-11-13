import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { hasSupabaseEnv, supabaseEnv } from "./env";

/**
 * Обновляет сессию Supabase в cookie на каждом запросе (T-02).
 *
 * Проверка ролей и защита /admin, /account появятся в T-06 — здесь только
 * продление сессии, чтобы пользователь не вылетал посреди работы.
 */
export async function updateSession(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, anonKey } = supabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Важно вызывать getUser(), а не getSession(): так токен проверяется на сервере.
  await supabase.auth.getUser();

  return response;
}
