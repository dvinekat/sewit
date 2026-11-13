import Link from "next/link";

import { AccountMenu } from "@/components/account/account-menu";
import { CartBadge } from "@/components/cart/cart-badge";
import { Logo } from "@/components/logo";

const NAV = [
  { href: "/catalog", label: "Каталог" },
  { href: "/#how-it-works", label: "Как это работает" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav aria-label="Основная навигация" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/catalog"
            className="rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
          >
            Каталог
          </Link>
          <CartBadge />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
