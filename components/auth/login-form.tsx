"use client";

import { useActionState, useEffect } from "react";

import {
  AuthAlert,
  AuthField,
  AuthPasswordField,
  AuthSubmitButton,
} from "@/components/auth/form-parts";
import { loginAction } from "@/lib/auth/actions";
import { initialAuthState } from "@/lib/auth/form-state";

/** Форма входа (FR-6.1): ошибки приходят с сервера уже на русском. */
export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(loginAction, initialAuthState);

  // Полная загрузка, а не router.push: иначе клиентский Supabase-клиент в шапке
  // останется с прежним состоянием «гость» (он инициализирован на /login).
  useEffect(() => {
    if (state.status === "success" && state.redirectTo) {
      window.location.assign(state.redirectTo);
    }
  }, [state]);

  return (
    <form action={formAction} noValidate className="space-y-4">
      <input type="hidden" name="next" value={next} />

      {state.status === "error" && state.message ? <AuthAlert>{state.message}</AuthAlert> : null}

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
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
      />

      <AuthSubmitButton pendingText="Входим…">Войти</AuthSubmitButton>
    </form>
  );
}
