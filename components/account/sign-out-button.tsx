"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";

/**
 * Выход из аккаунта (T-05).
 *
 * Делает полную загрузку после `signOut`: серверные страницы увидят удалённую
 * cookie, а шапка переинициализирует клиент Supabase уже как гость.
 */
export function SignOutButton() {
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    if (pending) return;

    setPending(true);

    if (hasSupabaseEnv()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }

    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- после signOut нужен новый документ, а не мягкая навигация со старым клиентом Supabase
    window.location.assign("/");
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className="w-full rounded-xl px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
    >
      {pending ? "Выходим…" : "Выйти из аккаунта"}
    </button>
  );
}
