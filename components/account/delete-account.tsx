"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { AuthAlert } from "@/components/auth/form-parts";
import { deleteAccountAction } from "@/lib/profile/actions";
import { initialProfileState } from "@/lib/profile/types";

/** Кнопка удаления: до подтверждения форма всё равно не отправит данные. */
function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center rounded-full bg-destructive px-5 py-2.5 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
    >
      {pending ? "Удаляем…" : "Удалить аккаунт навсегда"}
    </button>
  );
}

/**
 * Удаление аккаунта (T-37, FR-6.5).
 *
 * Подтверждение двойное — галочка и слово «удалить»: операция необратима,
 * а после успеха нужна полная загрузка, чтобы шапка перестала видеть сессию.
 */
export function DeleteAccount() {
  const [state, formAction] = useActionState(deleteAccountAction, initialProfileState);
  // Поля контролируемые: после неудачной попытки React не сбрасывает форму,
  // и подтверждение не приходится вводить заново.
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    if (state.status === "success" && state.redirectTo) {
      window.location.assign(state.redirectTo);
    }
  }, [state]);

  return (
    <section
      aria-labelledby="delete-account-title"
      className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5"
    >
      <h2 id="delete-account-title" className="font-display text-xl text-destructive">
        Удаление аккаунта
      </h2>

      <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
        <li>• Мерки, избранное и доступ к скачиванию выкроек удалятся навсегда.</li>
        <li>• Купленные PDF перестанут открываться из библиотеки.</li>
        <li>• История заказов останется обезличенной: состав и суммы без имени, e-mail и мерок.</li>
        <li>• Восстановить аккаунт или вернуть доступ к покупкам нельзя.</li>
      </ul>

      <form action={formAction} noValidate className="mt-4 space-y-4">
        {state.status === "error" && state.message ? <AuthAlert>{state.message}</AuthAlert> : null}

        <label className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
          <input
            type="checkbox"
            name="acknowledge"
            value="on"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            aria-invalid={Boolean(state.fieldErrors?.acknowledge)}
            aria-describedby={state.fieldErrors?.acknowledge ? "acknowledge-error" : undefined}
            className="mt-0.5 size-4 shrink-0 rounded border-line text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
          <span>Понимаю, что после удаления аккаунта доступ к выкройкам не восстановить.</span>
        </label>

        {state.fieldErrors?.acknowledge ? (
          <p id="acknowledge-error" className="text-xs text-destructive">
            {state.fieldErrors.acknowledge}
          </p>
        ) : null}

        <div className="max-w-xs space-y-1.5">
          <label htmlFor="delete-confirm" className="block text-sm font-medium text-foreground">
            Введите слово «удалить»
          </label>
          <input
            id="delete-confirm"
            name="confirm"
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="удалить"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            aria-invalid={Boolean(state.fieldErrors?.confirm)}
            aria-describedby={state.fieldErrors?.confirm ? "confirm-error" : "confirm-hint"}
            className="h-11 w-full rounded-xl border border-line bg-background px-3.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-destructive focus-visible:ring-2 focus-visible:ring-destructive/30"
          />
          {state.fieldErrors?.confirm ? (
            <p id="confirm-error" className="text-xs text-destructive">
              {state.fieldErrors.confirm}
            </p>
          ) : (
            <p id="confirm-hint" className="text-xs text-muted-foreground">
              Так мы убеждаемся, что удаление не случайно.
            </p>
          )}
        </div>

        <DeleteButton />
      </form>
    </section>
  );
}
