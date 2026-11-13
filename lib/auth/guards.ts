import { redirect } from "next/navigation";

import { ADMIN_DENIED_REDIRECT } from "@/lib/access";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

import { safeNextPath } from "./redirect";

/**
 * Серверные проверки сессии и роли (T-06).
 *
 * `getSessionUser` — единственная точка, где страница узнаёт пользователя:
 * профиль читается через RLS (`profiles_select_own_or_admin`), поэтому чужую
 * роль получить нельзя. Proxy делает ту же проверку раньше, но страница
 * не полагается на него одного.
 */

export type UserRole = "admin" | "user";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: string | null;
}

interface ProfileRow {
  name: string | null;
  role: string | null;
  created_at: string | null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!hasSupabaseEnv()) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, role, created_at")
      .eq("id", user.id)
      .maybeSingle<ProfileRow>();

    const metadataName = user.user_metadata?.name;

    return {
      id: user.id,
      email: user.email ?? "",
      name:
        profile?.name ??
        (typeof metadataName === "string" && metadataName.trim() ? metadataName : null),
      role: profile?.role === "admin" ? "admin" : "user",
      createdAt: profile?.created_at ?? user.created_at ?? null,
    };
  } catch {
    // Без БД считаем пользователя гостем: страница покажет форму входа,
    // а не сырую ошибку Supabase (DoD README 12, п. 7).
    return null;
  }
}

/** Страница личного кабинета: без сессии — на вход с возвратом назад. */
export async function requireUser(nextPath = "/account"): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(safeNextPath(nextPath))}`);
  }

  return user;
}

/** Админка: без сессии — на вход, без роли admin — в кабинет с пояснением. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser("/admin");

  if (user.role !== "admin") {
    redirect(ADMIN_DENIED_REDIRECT);
  }

  return user;
}
