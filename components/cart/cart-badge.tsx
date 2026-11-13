"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";

import { useCart } from "@/lib/cart/store";
import { cn } from "@/lib/utils";

/** Иконка корзины со счётчиком (T-28). Счётчик появляется после гидратации localStorage. */
export function CartBadge() {
  const hydrated = useCart((state) => state.hydrated);
  const count = useCart((state) => state.items.length);

  return (
    <Link
      href="/cart"
      aria-label={count > 0 ? `Корзина: ${count}` : "Корзина пуста"}
      className="relative inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <ShoppingBag aria-hidden="true" className="size-4" />
      {hydrated && count > 0 ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground",
          )}
        >
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
