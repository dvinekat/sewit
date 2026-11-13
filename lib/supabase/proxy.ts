import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { decideAccess } from "@/lib/access";

import { hasSupabaseEnv, supabaseEnv } from "./env";

/**
 * Обновляет сессию Supabase в cookie на каждом запросе (T-02) и закрывает
 * `/account` и `/admin` до рендера страницы (T-06, FR-8.1).
 *
 * Proxy — быстрый фильтр: он не заменяет проверку в страницах, а отсекает
 * анонимов и не-админов раньше, чтобы не отдавать лишний HTML.
 */

function redirectWithCookies(
  request: NextRequest,
  response: NextResponse,
  target: string,
): NextResponse {
  const redirectResponse = NextResponse.redirect(new URL(target, request.url));

  // Сессия могла обновиться в этом же запросе — переносим новые cookie,
  // иначе пользователь вылетит сразу после редиректа.
  for (const cookie of response.cookies.getAll()) {
    redirectResponse.cookies.set(cookie);
  }

  return redirectResponse;
}

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  let isAdmin = false;

  if (user && (pathname === "/admin" || pathname.startsWith("/admin/"))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: string | null }>();

    isAdmin = profile?.role === "admin";
  }

  const decision = decideAccess(pathname, { isAuthenticated: Boolean(user), isAdmin });

  if (decision.kind === "login") {
    const next = `${pathname}${search}`;
    return redirectWithCookies(request, response, `/login?next=${encodeURIComponent(next)}`);
  }

  if (decision.kind === "deny") {
    return redirectWithCookies(request, response, decision.redirectTo);
  }

  return response;
}
