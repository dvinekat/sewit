"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { AuthAlert, AuthField } from "@/components/auth/form-parts";
import { buttonVariants } from "@/components/ui/button";
import { updateNameAction } from "@/lib/profile/actions";
import { initialProfileState } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

/** Кнопка сохранения имени: блокируется, пока server action в работе. */
function SaveNameButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={cn(buttonVariants({ size: "sm" }))}>
      {pending ? "Сохраняем…" : "Сохранить имя"}
    </button>
  );
}

/**
 * Правка имени в профиле (T-37, FR-6.5).
 *
 * `router.refresh()` после успеха обновляет имя в шапке кабинета: оно приходит
 * из серверного layout, а форма живёт на клиенте.
 */
export function ProfileForm({ initialName }: { initialName: string }) {
  const [state, formAction] = useActionState(updateNameAction, initialProfileState);
  const [name, setName] = useState(initialName);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} noValidate className="mt-4 space-y-3">
      {state.status === "error" && state.message ? <AuthAlert>{state.message}</AuthAlert> : null}
      {state.status === "success" && state.message ? (
        <AuthAlert tone="success">{state.message}</AuthAlert>
      ) : null}

      <AuthField
        name="name"
        label="Имя"
        autoComplete="name"
        minLength={2}
        maxLength={80}
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
        hint="Так SewIt обращается к вам в кабинете и письмах."
        error={state.fieldErrors?.name}
      />

      <SaveNameButton />
    </form>
  );
}
