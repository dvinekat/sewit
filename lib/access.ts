/**
 * Правила доступа к закрытым разделам (T-06).
 *
 * Чистая функция без Next.js и Supabase: её использует proxy для быстрого
 * редиректа, а тесты проверяют границы `/account` и `/admin` без запуска сервера.
 * Окончательная проверка всё равно дублируется в серверных страницах (defense in depth).
 */

export type AccessDecision =
  { kind: "allow" } | { kind: "login" } | { kind: "deny"; redirectTo: string };

export const ADMIN_DENIED_REDIRECT = "/account?denied=admin";

function within(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

export interface AccessSubjects {
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export function decideAccess(pathname: string, subjects: AccessSubjects): AccessDecision {
  if (within(pathname, "/admin")) {
    if (!subjects.isAuthenticated) return { kind: "login" };

    return subjects.isAdmin
      ? { kind: "allow" }
      : { kind: "deny", redirectTo: ADMIN_DENIED_REDIRECT };
  }

  if (within(pathname, "/account")) {
    return subjects.isAuthenticated ? { kind: "allow" } : { kind: "login" };
  }

  return { kind: "allow" };
}
