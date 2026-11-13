"use client";

import Link from "next/link";
import { useActionState } from "react";

import { AuthAlert, AuthField, AuthSubmitButton } from "@/components/auth/form-parts";
import { requestPasswordResetAction } from "@/lib/auth/actions";
import { initialAuthState } from "@/lib/auth/form-state";

/** Запрос письма для сброса пароля (FR-6.1). */
export function ResetRequestForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, initialAuthState);

  if (state.status === "success") {
    return (
      <div className="space-y-4">
        <AuthAlert tone="success">{state.message}</AuthAlert>
        <Link
          href="/login"
          className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Вернуться ко входу
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="space-y-4">
      {state.status === "error" && state.message ? <AuthAlert>{state.message}</AuthAlert> : null}

      <AuthField
        name="email"
        label="E-mail аккаунта"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        error={state.fieldErrors?.email}
      />

      <AuthSubmitButton pendingText="Отправляем…">Отправить ссылку</AuthSubmitButton>
    </form>
  );
}
