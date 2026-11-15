"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/patterns", label: "Выкройки" },
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/promo", label: "Промокоды" },
  { href: "/admin/sales", label: "Сводка продаж" },
];

/** Навигация админки с активным разделом (T-38). */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Разделы админки" className="mt-4 space-y-1">
      {ITEMS.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);

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
