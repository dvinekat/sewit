"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/account", label: "Обзор" },
  { href: "/account/library", label: "Библиотека" },
  { href: "/account/favorites", label: "Избранное" },
  { href: "/account/orders", label: "Заказы" },
];

/** Навигация кабинета с активным разделом (T-07). */
export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Разделы кабинета" className="mt-4 space-y-1">
      {ITEMS.map((item) => {
        const active =
          item.href === "/account" ? pathname === "/account" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "block rounded-xl px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active
                ? "bg-secondary font-medium text-foreground"
                : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
