import type { Metadata } from "next";
import Link from "next/link";

import { BrowserCheck } from "@/components/health/browser-check";
import { describeSupabaseError } from "@/lib/supabase/errors";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Проверка Supabase",
  robots: { index: false, follow: false },
};

type CheckResult =
  { ok: true; categories: number; patterns: number } | { ok: false; message: string };

/** Чтение БД на сервере (T-02): анонимный клиент, поэтому видны только опубликованные. */
async function checkOnServer(): Promise<CheckResult> {
  if (!hasSupabaseEnv()) {
    return {
      ok: false,
      message: "Не заданы NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY",
    };
  }

  try {
    const supabase = await createClient();
    // Без head: true: PostgREST отвечает 204 на HEAD даже для несуществующей
    // таблицы, и проверка ложно показывала бы «работает».
    const [categories, patterns] = await Promise.all([
      supabase.from("categories").select("id", { count: "exact" }),
      supabase.from("patterns").select("id", { count: "exact" }),
    ]);

    if (categories.error) throw categories.error;
    if (patterns.error) throw patterns.error;

    return { ok: true, categories: categories.count ?? 0, patterns: patterns.count ?? 0 };
  } catch (error) {
    return { ok: false, message: describeSupabaseError(error) };
  }
}

export default async function HealthPage() {
  const server = await checkOnServer();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        Служебная страница
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight">Проверка Supabase</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Страница подтверждает T-02: приложение читает базу и на сервере, и в браузере. Если ниже
        ошибка «Could not find the table», значит миграция ещё не применена — запустите SQL из
        <code className="mx-1 rounded bg-secondary px-1.5 py-0.5 text-xs">supabase/migrations</code>
        .
      </p>

      <div className="mt-8 grid gap-4">
        <section className="rounded-2xl border border-line bg-card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl">Сервер</h2>
            <StatusPill ok={server.ok} />
          </div>

          {server.ok ? (
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Metric label="Категорий" value={server.categories} />
              <Metric label="Опубликованных выкроек" value={server.patterns} />
            </dl>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-destructive">{server.message}</p>
          )}
        </section>

        <BrowserCheck />
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Ожидаемые значения после сида: 5 категорий и 6 выкроек. Седьмая — черновик, анонимному ключу
        она недоступна благодаря RLS.
      </p>

      <Link
        href="/catalog"
        className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Открыть каталог
      </Link>
    </div>
  );
}

function StatusPill({ ok }: { ok: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        ok ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
      }`}
    >
      {ok ? "работает" : "ошибка"}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line/70 bg-background px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-display text-2xl">{value}</dd>
    </div>
  );
}
