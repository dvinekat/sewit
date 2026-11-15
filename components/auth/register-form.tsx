"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";

import {
  AuthAlert,
  AuthField,
  AuthPasswordField,
  AuthSubmitButton,
} from "@/components/auth/form-parts";
import { registerAction } from "@/lib/auth/actions";
import { initialAuthState } from "@/lib/auth/form-state";

/**
 * Форма регистрации (FR-6.1, FR-9.3).
 *
 * Без согласия на обработку ПД кнопка не отправляет данные: проверка есть и в
 * браузере (`required` + серверная схема), и на сервере — в `registerAction`.
 */
export function RegisterForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(registerAction, initialAuthState);

  useEffect(() => {
    if (state.status === "success" && state.redirectTo) {
      window.location.assign(state.redirectTo);
    }
  }, [state]);

  return (
    <form action={formAction} noValidate className="space-y-4">
      <input type="hidden" name="next" value={next} />

      {state.status === "error" && state.message ? <AuthAlert>{state.message}</AuthAlert> : null}

      {state.status === "success" && state.message ? (
        <AuthAlert tone="success">{state.message}</AuthAlert>
      ) : null}

      <AuthField
        name="name"
        label="Как к вам обращаться"
        type="text"
        autoComplete="name"
        placeholder="Анна"
        required
        error={state.fieldErrors?.name}
      />

      <AuthField
        name="email"
        label="E-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        error={state.fieldErrors?.email}
      />

      <AuthPasswordField
        name="password"
        label="Пароль"
        autoComplete="new-password"
        minLength={8}
        hint="Минимум 8 символов"
        required
        error={state.fieldErrors?.password}
      />

      <div className="space-y-1.5">
        <label className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
          <input
            type="checkbox"
            name="consent"
            value="on"
            required
            aria-invalid={Boolean(state.fieldErrors?.consent)}
            aria-describedby={state.fieldErrors?.consent ? "consent-error" : undefined}
            className="mt-0.5 size-4 shrink-0 rounded border-line accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
          <span>
            Согласен(на) на{" "}
            <Link
              href="/legal/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              обработку персональных данных
            </Link>
            : e-mail, имя и мерки нужны, чтобы работал кабинет и подбор размера.
          </span>
        </label>
        {state.fieldErrors?.consent ? (
          <p id="consent-error" className="text-xs text-destructive">
            {state.fieldErrors.consent}
          </p>
        ) : null}
      </div>

      <AuthSubmitButton pendingText="Создаём аккаунт…">Зарегистрироваться</AuthSubmitButton>
    </form>
  );
}
