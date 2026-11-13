import { Clock, Layers, Ruler } from "lucide-react";

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
 * Карточка-превью каталога (T-08): обложка, название, цена, сложность, время пошива.
 * Пока не ссылка: карточка выкройки `/patterns/[slug]` появится отдельной задачей (T-13).
 */
export function PatternCard({
  pattern,
  categoryTitle,
}: {
  pattern: Pattern;
  categoryTitle: string;
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card">
      <div className="relative aspect-[4/3]">
        <PatternCover slug={pattern.slug} className="h-full w-full" />
        <Badge
          variant="outline"
          className="absolute left-3 top-3 border-line/60 bg-background/85 backdrop-blur"
        >
          {categoryTitle}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <h3 className="font-display text-xl leading-tight text-foreground">{pattern.title}</h3>
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
    </article>
  );
}
