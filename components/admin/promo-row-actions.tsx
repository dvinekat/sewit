"use client";

import Link from "next/link";
import { useState } from "react";

import { deletePromoAction, togglePromoAction } from "@/lib/admin/actions";

/**
 * Действия строки промокода (T-42).
 *
 * Включение — одна кнопка, удаление — двухшаговое: случайно снести промокод,
 * который уже использовали покупатели, не должно быть возможно в один клик.
 */
export function PromoRowActions({ id, active }: { id: string; active: boolean }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link
        href={`/admin/promo/${id}`}
        className="rounded-full px-2.5 py-1 text-xs text-muted-foreground underline-offset-4 transition-colors hover:bg-secondary hover:text-foreground hover:underline"
      >
        Изменить
      </Link>

      <form action={togglePromoAction}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="active" value={active ? "0" : "1"} />
        <button
          type="submit"
          className="rounded-full px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {active ? "Выключить" : "Включить"}
        </button>
      </form>

      {confirming ? (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-destructive">Удалить?</span>
          <form action={deletePromoAction}>
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              className="rounded-full bg-destructive px-2.5 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90"
            >
              Да
            </button>
          </form>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-full px-2.5 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            Нет
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-full px-2.5 py-1 text-xs text-destructive transition-colors hover:bg-destructive/10"
        >
          Удалить
        </button>
      )}
    </div>
  );
}
