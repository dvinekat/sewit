"use client";

import { useState } from "react";

import { deleteCategoryAction } from "@/lib/admin/category-actions";

/**
 * Удаление категории (T-40): только пустой. Если в ней есть выкройки,
 * кнопка недоступна, а сервер дополнительно проверит это и покажет причину.
 */
export function CategoryDeleteButton({ id, patternCount }: { id: string; patternCount: number }) {
  const [confirming, setConfirming] = useState(false);

  if (patternCount > 0) {
    return (
      <p className="mt-4 rounded-xl border border-line bg-background p-3 text-xs leading-relaxed text-muted-foreground">
        В категории {patternCount} выкроек (включая черновики) — удаление недоступно. Сначала
        перенесите их в другую категорию.
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      {confirming ? (
        <>
          <span className="text-sm text-destructive">Удалить категорию безвозвратно?</span>
          <form action={deleteCategoryAction}>
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
          Удалить категорию
        </button>
      )}
    </div>
  );
}
