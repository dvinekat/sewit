"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteMeasurementsAction, saveMeasurementsAction } from "@/lib/measurements/actions";
import { MEASUREMENT_FIELDS } from "@/lib/measurements/fields";
import {
  fieldErrors,
  measurementsSchema,
  type MeasurementsField,
  type MeasurementsValues,
} from "@/lib/schemas/measurements";
import { cn } from "@/lib/utils";

const EMPTY_INPUTS: Record<MeasurementsField, string> = {
  bust: "",
  waist: "",
  hips: "",
  height: "",
};

const inputClass =
  "w-full rounded-xl border border-line bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40";

function toInputs(values: MeasurementsValues): Record<MeasurementsField, string> {
  return {
    bust: String(values.bust),
    waist: String(values.waist),
    hips: String(values.hips),
    height: String(values.height),
  };
}

/**
 * Правка и удаление сохранённых мерок в кабинете (T-37, FR-3.4).
 *
 * Расчёт размера остаётся в карточке выкройки; здесь только ведение данных
 * профиля. Значения перепроверяются той же схемой, что и на сервере, а запись
 * идёт серверным экшеном от имени сессии.
 */
export function MeasurementsForm({
  initial,
  updatedAt,
}: {
  initial: MeasurementsValues | null;
  updatedAt: string | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<MeasurementsField, string>>(() =>
    initial ? toInputs(initial) : EMPTY_INPUTS,
  );
  const [errors, setErrors] = useState<Partial<Record<MeasurementsField, string>>>({});
  const [saved, setSaved] = useState<MeasurementsValues | null>(initial);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function save() {
    if (busy) return;

    const parsed = measurementsSchema.safeParse(values);

    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      setNotice({ tone: "error", text: "Сначала исправьте значения мерок." });
      return;
    }

    setBusy(true);
    setErrors({});
    setNotice(null);
    const response = await saveMeasurementsAction(parsed.data);
    setBusy(false);
    setNotice({
      tone: response.status === "success" ? "success" : "error",
      text: response.message,
    });

    if (response.status === "success") {
      setSaved(response.values ?? parsed.data);
      router.refresh();
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
      setValues(EMPTY_INPUTS);
      setErrors({});
      router.refresh();
    }
  }

  return (
    <div className="mt-4 space-y-4">
      {saved && updatedAt ? (
        <p className="text-xs text-muted-foreground">{updatedAt}</p>
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Сохранённых мерок пока нет. Введите их один раз — SewIt подставит значения в подбор
          размера в карточке выкройки.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
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
                aria-describedby={error ? `${field.name}-error` : `${field.name}-hint`}
                className={cn(
                  inputClass,
                  "mt-1",
                  error && "border-destructive focus-visible:border-destructive",
                )}
              />
              {error ? (
                <span id={`${field.name}-error`} className="mt-1 block text-xs text-destructive">
                  {error}
                </span>
              ) : (
                <span
                  id={`${field.name}-hint`}
                  className="mt-1 block text-xs text-muted-foreground"
                >
                  {field.hint}, см
                </span>
              )}
            </label>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
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
            Удалить мерки
          </button>
        ) : null}
      </div>

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
  );
}
