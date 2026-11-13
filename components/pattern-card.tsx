import { Clock, Layers, Ruler } from "lucide-react";
import Link from "next/link";

import { PatternCover } from "@/components/pattern-cover";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatSewingHours, getLevelLabel } from "@/lib/format";
import type { Pattern } from "@/lib/patterns";

function sizeRange(pattern: Pattern): string {
  const first = pattern.sizes[0]?.label;
  const last = pattern.sizes.at(-1)?.label;
  if (!first || !last) return "—";
  return first === last ? first : `${first}–${last}`;
}

/**
 * Карточка каталога (T-08): обложка, название, цена, сложность, время пошива.
 * Вся карточка — ссылка на страницу выкройки (FR-1.1).
 */
export function PatternCard({
  pattern,
  categoryTitle,
}: {
  pattern: Pattern;
  categoryTitle: string;
}) {
  return (
    <article className="h-full overflow-hidden rounded-2xl border border-line bg-card transition-colors hover:border-primary/40">
      <Link
        href={`/patterns/${pattern.slug}`}
        className="group flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <PatternCover
            slug={pattern.slug}
            coverUrl={pattern.coverUrl}
            alt={`${pattern.title} — фото готового изделия`}
            className="h-full w-full"
          />
          <Badge
            variant="outline"
            className="absolute left-3 top-3 border-line/60 bg-background/85 backdrop-blur"
          >
            {categoryTitle}
          </Badge>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <h3 className="font-display text-xl leading-tight text-foreground transition-colors group-hover:text-primary">
              {pattern.title}
            </h3>
            <p className="shrink-0 rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-foreground">
              {formatPrice(pattern.price)}
            </p>
          </div>

          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {pattern.description}
          </p>

          <dl className="mt-auto flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line/70 pt-3 text-xs text-muted-foreground">
            <div>
              <dt className="sr-only">Доступные размеры</dt>
              <dd className="flex items-center gap-1.5">
                <Ruler aria-hidden="true" className="size-3.5 shrink-0" />
                <span>{sizeRange(pattern)}</span>
              </dd>
            </div>
            <div>
              <dt className="sr-only">Время пошива</dt>
              <dd className="flex items-center gap-1.5">
                <Clock aria-hidden="true" className="size-3.5 shrink-0" />
                <span>{formatSewingHours(pattern.sewingHours)}</span>
              </dd>
            </div>
            <div>
              <dt className="sr-only">Сложность</dt>
              <dd className="flex items-center gap-1.5">
                <Layers aria-hidden="true" className="size-3.5 shrink-0" />
                <span>{getLevelLabel(pattern.level)}</span>
              </dd>
            </div>
          </dl>
        </div>
      </Link>
    </article>
  );
}
