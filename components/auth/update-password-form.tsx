"use client";

import { useActionState, useEffect } from "react";

import { AuthAlert, AuthPasswordField, AuthSubmitButton } from "@/components/auth/form-parts";
import { updatePasswordAction } from "@/lib/auth/actions";
import { initialAuthState } from "@/lib/auth/form-state";

/** Новый пароль после перехода по ссылке из письма (FR-6.1). */
export function UpdatePasswordForm() {
  const [state, formAction] = useActionState(updatePasswordAction, initialAuthState);

  useEffect(() => {
    if (state.status === "success" && state.redirectTo) {
      window.location.assign(state.redirectTo);
    }
  }, [state]);

  return (
    <form action={formAction} noValidate className="space-y-4">
      {state.status === "error" && state.message ? <AuthAlert>{state.message}</AuthAlert> : null}

      <AuthPasswordField
        name="password"
        label="Новый пароль"
        autoComplete="new-password"
        minLength={8}
        hint="Минимум 8 символов"
        required
        error={state.fieldErrors?.password}
      />

      <AuthSubmitButton pendingText="Сохраняем…">Сохранить пароль</AuthSubmitButton>
    </form>
  );
}
