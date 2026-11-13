import Link from "next/link";

import { cn } from "@/lib/utils";

/** Логотип: стежок в терракотовом квадрате + словесный знак. */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="SewIt — на главную"
      className={cn("group inline-flex items-center gap-2.5 rounded-lg", className)}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-primary text-primary-foreground shadow-sm transition-colors group-hover:bg-primary/90">
        <svg viewBox="0 0 40 40" className="size-6" fill="none" aria-hidden="true">
          <path
            d="M12 27c4 0 4-14 8-14s4 14 8 14"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <circle cx="12" cy="27" r="1.7" fill="currentColor" />
          <circle cx="28" cy="13" r="1.7" fill="currentColor" />
        </svg>
      </span>
      <span className={cn("flex flex-col leading-none", compact && "sr-only")}>
        <span className="font-display text-xl font-semibold tracking-tight text-foreground">
          SewIt
        </span>
        <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          выкройки по меркам
        </span>
      </span>
    </Link>
  );
}
