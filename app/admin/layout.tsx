import Link from "next/link";

import { AdminNav } from "@/components/admin/admin-nav";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";

/**
 * Каркас админки (T-38, FR-8.1).
 *
 * Роль проверяется до рендера любой страницы раздела: proxy отсекает гостей,
 * `requireAdmin` — покупателей без роли admin. Дочерние страницы не обязаны
 * повторять проверку, но и не полагаются только на неё при чтении данных:
 * RLS `is_admin()` отдаёт чужие строки лишь администратору.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
        <aside className="lg:sticky lg:top-24">
          <div className="rounded-2xl border border-line bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Админка
            </p>
            <p className="mt-2 truncate font-medium">{admin.name ?? "Администратор"}</p>
            <p className="truncate text-xs text-muted-foreground">{admin.email}</p>
            <Badge variant="sage" className="mt-2">
              роль admin
            </Badge>
          </div>

          <AdminNav />

          <div className="mt-4 space-y-2">
            <Link
              href="/catalog"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
            >
              Открыть витрину
            </Link>
            <Link
              href="/account"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full")}
            >
              Мой кабинет
            </Link>
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
