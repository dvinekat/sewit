import { AccountNav } from "@/components/account/account-nav";
import { SignOutButton } from "@/components/account/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth/guards";

/** Каркас личного кабинета: сессия проверяется до рендера дочерних страниц (T-06). */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
        <aside className="lg:sticky lg:top-24">
          <div className="rounded-2xl border border-line bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Личный кабинет
            </p>
            <p className="mt-2 truncate font-medium">{user.name ?? "Покупатель"}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            {user.role === "admin" ? (
              <Badge variant="sage" className="mt-2">
                Администратор
              </Badge>
            ) : null}
          </div>

          <AccountNav />

          <div className="mt-4">
            <SignOutButton />
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
