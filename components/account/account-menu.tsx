"use client";

import { Heart, LogIn, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";

/**
 * Меню аккаунта в шапке (T-05, T-07).
 *
 * Шапка живёт в статическом layout, поэтому сессия читается на клиенте:
 * так каталог и карточка остаются ISR-страницами. После входа серверный экшен
 * меняет cookie — эффект на смену `pathname` перечитывает пользователя, и шапка
 * обновляется без полной перезагрузки.
 */
export function AccountMenu() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(() => !hasSupabaseEnv());
  const [signingOut, setSigningOut] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!hasSupabaseEnv()) return;

    let active = true;
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setEmail(data.user?.email ?? null);
      setReady(true);
    });

    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    if (!hasSupabaseEnv()) return;

    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
      setReady(true);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    if (!hasSupabaseEnv() || signingOut) return;

    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setSigningOut(false);
    // Полная загрузка: серверные страницы и шапка одновременно теряют сессию.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- после signOut нужен новый документ, а не мягкая навигация со старым клиентом Supabase
    window.location.assign("/");
  }

  if (!ready || !email) {
    return (
      <Link
        href="/login"
        aria-label="Войти в аккаунт"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
      >
        <LogIn aria-hidden="true" />
        <span className="hidden sm:inline">Войти</span>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Link
        href="/account/favorites"
        aria-label="Избранное"
        className="hidden size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:inline-flex"
      >
        <Heart aria-hidden="true" className="size-4" />
      </Link>

      <Link
        href="/account"
        aria-label="Личный кабинет"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "w-9 gap-1.5 px-0 sm:w-auto sm:px-4",
        )}
      >
        <UserRound aria-hidden="true" />
        <span className="hidden sm:inline">Кабинет</span>
      </Link>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        aria-label="Выйти из аккаунта"
        title="Выйти"
        className="hidden size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 sm:inline-flex"
      >
        <LogOut aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
