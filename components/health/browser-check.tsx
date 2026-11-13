"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { describeSupabaseError } from "@/lib/supabase/errors";

type State =
  | { status: "loading" }
  | { status: "ok"; categories: number; patterns: number }
  | { status: "error"; message: string };

/**
 * Проверка чтения БД из браузера (T-02): тот же публичный ключ, что увидит гость.
 * Значения должны совпасть с серверными — значит и серверный, и браузерный клиенты живы.
 */
export function BrowserCheck() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!hasSupabaseEnv()) {
        setState({ status: "error", message: "Нет NEXT_PUBLIC_SUPABASE_URL / ANON_KEY" });
        return;
      }

      try {
        const supabase = createClient();
        // head: true здесь не годится: HEAD отдаёт 204 даже без таблицы.
        const [categories, patterns] = await Promise.all([
          supabase.from("categories").select("id", { count: "exact" }),
          supabase.from("patterns").select("id", { count: "exact" }),
        ]);

        if (categories.error) throw categories.error;
        if (patterns.error) throw patterns.error;

        if (!cancelled) {
          setState({
            status: "ok",
            categories: categories.count ?? 0,
            patterns: patterns.count ?? 0,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message: describeSupabaseError(error),
          });
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-2xl border border-line bg-card p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl">Браузер</h2>
        <StatusPill state={state} />
      </div>

      {state.status === "loading" && (
        <p className="mt-3 text-sm text-muted-foreground">Запрашиваем категории из браузера…</p>
      )}

      {state.status === "ok" && (
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <Metric label="Категорий" value={state.categories} />
          <Metric label="Опубликованных выкроек" value={state.patterns} />
        </dl>
      )}

      {state.status === "error" && (
        <p className="mt-3 text-sm leading-relaxed text-destructive">{state.message}</p>
      )}
    </section>
  );
}

function StatusPill({ state }: { state: State }) {
  const tone =
    state.status === "ok"
      ? "bg-primary/10 text-primary"
      : state.status === "error"
        ? "bg-destructive/10 text-destructive"
        : "bg-secondary text-muted-foreground";

  const label =
    state.status === "ok" ? "работает" : state.status === "error" ? "ошибка" : "проверяем";

  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${tone}`}>{label}</span>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line/70 bg-background px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-display text-2xl">{value}</dd>
    </div>
  );
}
