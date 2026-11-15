"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { deleteMeasurementsAction, saveMeasurementsAction } from "@/lib/measurements/actions";
import { MEASUREMENT_FIELDS } from "@/lib/measurements/fields";
import type { CategorySlug, PatternSize } from "@/lib/pattern-domain";
import {
  fieldErrors,
  measurementsSchema,
  type MeasurementsField,
  type MeasurementsValues,
} from "@/lib/schemas/measurements";
import { fitSize, garmentTypeForCategory, type SizeFitResult } from "@/lib/size-fit";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";

const EMPTY_VALUES: Record<MeasurementsField, string> = {
  bust: "",
  waist: "",
  hips: "",
  height: "",
};

const inputClass =
  "mt-1 w-full rounded-xl border border-line bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40";

function toFormValues(values: MeasurementsValues): Record<MeasurementsField, string> {
  return {
    bust: String(values.bust),
    waist: String(values.waist),
    hips: String(values.hips),
    height: String(values.height),
  };
}

type SessionState = "checking" | "guest" | "user";

/**
 * Подбор размера по меркам и сохранение мерок (T-18–T-20, T-19).
 *
 * Расчёт всегда идёт в браузере — мерки не покидают устройство без явного
 * «Сохранить». Для вошедшего пользователя форма подставляет сохранённые мерки
 * из профиля и позволяет обновить или удалить их (FR-3.4).
 */
export function SizeFitSection({
  sizes,
  categorySlug,
  patternSlug,
}: {
  sizes: PatternSize[];
  categorySlug: CategorySlug;
  patternSlug: string;
}) {
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState<Partial<Record<MeasurementsField, string>>>({});
  const [result, setResult] = useState<SizeFitResult | null>(null);
  const [session, setSession] = useState<SessionState>(() =>
    hasSupabaseEnv() ? "checking" : "guest",
  );
  const [saved, setSaved] = useState<MeasurementsValues | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!hasSupabaseEnv()) return;

    let active = true;
    const supabase = createClient();

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        setSession("guest");
        return;
      }

      setSession("user");

      const { data: row } = await supabase
        .from("measurements")
        .select("bust, waist, hips, height")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!active || !row) return;

      const restored: MeasurementsValues = {
        bust: Number(row.bust),
        waist: Number(row.waist),
        hips: Number(row.hips),
        height: Number(row.height),
      };

      setSaved(restored);
      setValues(toFormValues(restored));
      setResult(fitSize(restored, sizes, garmentTypeForCategory(categorySlug)));
    })();

    return () => {
      active = false;
    };
  }, [categorySlug, sizes]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = measurementsSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      setResult(null);
      setNotice(null);
      return;
    }

    setErrors({});
    setNotice(null);
    setResult(fitSize(parsed.data, sizes, garmentTypeForCategory(categorySlug)));
  }

  function reset() {
    setValues(EMPTY_VALUES);
    setErrors({});
    setResult(null);
    setNotice(null);
  }

  async function save() {
    if (busy) return;

    const parsed = measurementsSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      setNotice({ tone: "error", text: "Сначала исправьте значения мерок." });
      return;
    }

    setBusy(true);
    setNotice(null);
    const response = await saveMeasurementsAction(parsed.data);
    setBusy(false);
    setNotice({
      tone: response.status === "success" ? "success" : "error",
      text: response.message,
    });

    if (response.status === "success") {
      setSaved(response.values ?? parsed.data);
    }
  }

  async function remove() {
    if (busy) return;

    setBusy(true);
    setNotice(null);
    const response = await deleteMeasurementsAction();
    setBusy(false);
    setNotice({
      tone: response.status === "success" ? "success" : "error",
      text: response.message,
    });

    if (response.status === "success") {
      setSaved(null);
    }
  }

  return (
    <section
      id="size-fit"
      aria-labelledby="size-fit-title"
      className="scroll-mt-24 rounded-3xl border border-line bg-card p-6 sm:p-8"
    >
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Подбор размера
        </p>
        <h2 id="size-fit-title" className="mt-2 font-display text-3xl">
          Введите мерки — подскажем размер
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Снимайте мерки по белью, сантиметровая лента должна прилегать, но не стягивать. Расчёт
          идёт по формуле SewIt: грудь 40%, талия 30%, бёдра 30%.
        </p>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
          {MEASUREMENT_FIELDS.map((field) => {
            const error = errors[field.name];

            return (
              <label key={field.name} className="block">
                <span className="text-xs font-medium text-muted-foreground">{field.label}</span>
                <input
                  type="number"
                  name={field.name}
                  inputMode="decimal"
                  min={field.min}
                  max={field.max}
                  step="0.5"
                  value={values[field.name]}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [field.name]: event.target.value }))
                  }
                  placeholder={field.placeholder}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${field.name}-error` : undefined}
                  className={cn(
                    inputClass,
                    error && "border-destructive focus-visible:border-destructive",
                  )}
                />
                {error ? (
                  <span id={`${field.name}-error`} className="mt-1 block text-xs text-destructive">
                    {error}
                  </span>
                ) : (
                  <span className="mt-1 block text-xs text-muted-foreground">{field.hint}</span>
                )}
              </label>
            );
          })}

          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Подобрать размер
            </button>
            <button
              type="button"
              onClick={reset}
              className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Сбросить
            </button>
          </div>

          <div className="space-y-2 rounded-2xl bg-secondary/40 p-4 sm:col-span-2">
            {session === "user" ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={save}
                    disabled={busy}
                    className="inline-flex items-center rounded-full border border-line bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
                  >
                    {busy ? "Сохраняем…" : saved ? "Обновить мерки" : "Сохранить мерки"}
                  </button>

                  {saved ? (
                    <button
                      type="button"
                      onClick={remove}
                      disabled={busy}
                      className="text-sm text-destructive underline-offset-4 transition-colors hover:underline disabled:opacity-50"
                    >
                      Удалить из профиля
                    </button>
                  ) : null}
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  Сохранённые мерки подставятся сюда при следующем входе и появятся в кабинете.
                </p>
              </>
            ) : session === "guest" ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                Хотите сохранить мерки?{" "}
                <Link
                  href={`/login?next=${encodeURIComponent(`/patterns/${patternSlug}#size-fit`)}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Войдите
                </Link>{" "}
                — они подставятся в форму в следующий раз.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Проверяем сохранённые мерки…</p>
            )}

            {notice ? (
              <p
                role="status"
                className={cn(
                  "text-xs leading-relaxed",
                  notice.tone === "success" ? "text-sage" : "text-destructive",
                )}
              >
                {notice.text}
              </p>
            ) : null}
          </div>
        </form>

        <div aria-live="polite">{result ? <FitResult result={result} /> : <EmptyResult />}</div>
      </div>
    </section>
  );
}

function EmptyResult() {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-background p-6 text-sm text-muted-foreground">
      <p className="font-display text-lg text-foreground">Здесь появится рекомендация</p>
      <p className="mt-2 leading-relaxed">
        Заполните четыре мерки и нажмите «Подобрать размер». Рекомендация не блокирует покупку:
        окончательный размер вы выбираете сами.
      </p>
    </div>
  );
}

function FitResult({ result }: { result: SizeFitResult }) {
  return (
    <div className="rounded-2xl bg-secondary/60 p-6">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Рекомендуемый размер</p>
      <p className="mt-1 font-display text-5xl leading-none text-primary">
        {result.recommended.label}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Ближайшие варианты: {result.alternatives.map((size) => size.label).join(", ") || "—"}
      </p>

      {result.warnings.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {result.warnings.map((warning) => (
            <li
              key={warning.code}
              className="rounded-xl border border-primary/20 bg-background p-3"
            >
              <p className="text-sm font-medium">{warning.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {warning.message}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-xl border border-line bg-background p-3 text-xs leading-relaxed text-muted-foreground">
          Явных предупреждений нет: мерки близки к размерной сетке модели.
        </p>
      )}

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Предупреждения не блокируют покупку — они сохранятся в заказе, чтобы вы могли вернуться к
        ним при пошиве.
      </p>
    </div>
  );
}
