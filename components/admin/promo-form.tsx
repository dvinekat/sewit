"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { AuthAlert, AuthField } from "@/components/auth/form-parts";
import { buttonVariants } from "@/components/ui/button";
import { createPromoAction, updatePromoAction } from "@/lib/admin/actions";
import { initialAdminState } from "@/lib/admin/form-state";
import type { PromoFormValues } from "@/lib/admin/promo-form";
import { cn } from "@/lib/utils";

const numericClass =
  "h-11 w-full rounded-xl border border-line bg-background px-3.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40";

function SubmitPromoButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={cn(buttonVariants({ size: "default" }))}>
      {pending ? "Сохраняем…" : mode === "edit" ? "Сохранить промокод" : "Создать промокод"}
    </button>
  );
}

/**
 * Форма промокода (T-42, FR-8.6): одна на создание и редактирование.
 *
 * Поля контролируемые: ошибка сервера не должна стирать уже введённые данные.
 * Код нормализуется в верхний регистр на сервере, подсказка — здесь.
 */
export function PromoForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial: PromoFormValues;
}) {
  const [state, formAction] = useActionState(
    mode === "edit" ? updatePromoAction : createPromoAction,
    initialAdminState,
  );
  const [values, setValues] = useState(initial);

  function update<K extends keyof PromoFormValues>(field: K, value: PromoFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  return (
    <form action={formAction} noValidate className="mt-4 space-y-4">
      {mode === "edit" && initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      {state.status === "error" && state.message ? <AuthAlert>{state.message}</AuthAlert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <AuthField
          name="code"
          label="Код"
          placeholder="SEW10"
          required
          value={values.code}
          onChange={(event) => update("code", event.target.value.toUpperCase())}
          hint="Латиница, цифры, дефис и подчёркивание; покупатель вводит код на оформлении."
          error={state.fieldErrors?.code}
          className="uppercase"
        />

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Скидка, %</span>
            <input
              type="number"
              name="percent"
              min={1}
              max={100}
              step={1}
              required
              value={values.percent}
              onChange={(event) => update("percent", event.target.value)}
              aria-invalid={Boolean(state.fieldErrors?.percent)}
              className={cn(numericClass, "mt-1.5")}
            />
            {state.fieldErrors?.percent ? (
              <span className="mt-1 block text-xs text-destructive">
                {state.fieldErrors.percent}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">Лимит, раз</span>
            <input
              type="number"
              name="maxUses"
              min={1}
              max={100000}
              step={1}
              required
              value={values.maxUses}
              onChange={(event) => update("maxUses", event.target.value)}
              aria-invalid={Boolean(state.fieldErrors?.maxUses)}
              className={cn(numericClass, "mt-1.5")}
            />
            {state.fieldErrors?.maxUses ? (
              <span className="mt-1 block text-xs text-destructive">
                {state.fieldErrors.maxUses}
              </span>
            ) : null}
          </label>
        </div>

        <AuthField
          name="expiresAt"
          label="Действует до"
          type="date"
          value={values.expiresAt}
          onChange={(event) => update("expiresAt", event.target.value)}
          hint="Пусто — бессрочно."
          error={state.fieldErrors?.expiresAt}
        />

        <label className="flex items-start gap-3 self-end text-sm leading-relaxed text-foreground">
          <input
            type="checkbox"
            name="active"
            checked={values.active}
            onChange={(event) => update("active", event.target.checked)}
            className="mt-1 size-4 shrink-0 rounded border-line text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
          <span>
            Промокод активен
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Выключенный код не принимается на оформлении, но остаётся в истории заказов.
            </span>
          </span>
        </label>
      </div>

      {state.fieldErrors?.active ? (
        <p className="text-xs text-destructive">{state.fieldErrors.active}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitPromoButton mode={mode} />
        <Link
          href="/admin/promo"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Отмена
        </Link>
      </div>
    </form>
  );
}
