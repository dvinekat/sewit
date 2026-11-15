"use client";

import { useState } from "react";

import { deletePatternAction } from "@/lib/admin/pattern-actions";

/**
 * Удаление выкройки в два шага (T-39): удаление необратимо и уносит файлы.
 * Если выкройку покупали, кнопка недоступна — сервер дополнительно проверит это.
 */
export function PatternDeleteButton({ id, disabled }: { id: string; disabled: boolean }) {
  const [confirming, setConfirming] = useState(false);

  if (disabled) {
    return (
      <p className="mt-4 rounded-xl border border-line bg-background p-3 text-xs leading-relaxed text-muted-foreground">
        Есть оплаченные заказы: удаление недоступно. Поставьте статус «Черновик», чтобы убрать
        выкройку из каталога.
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      {confirming ? (
        <>
          <span className="text-sm text-destructive">Удалить выкройку и файлы безвозвратно?</span>
          <form action={deletePatternAction}>
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              className="rounded-full bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
            >
              Да, удалить
            </button>
          </form>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Отмена
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-full border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          Удалить выкройку
        </button>
      )}
    </div>
  );
}
