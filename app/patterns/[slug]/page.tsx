import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PatternCover } from "@/components/pattern-cover";
import { FavoriteButton } from "@/components/pattern/favorite-button";
import { SizeFitSection } from "@/components/pattern/size-fit-section";
import { SizePanel } from "@/components/pattern/size-panel";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatSewingHours, getLevelLabel } from "@/lib/format";
import { CATEGORY_TITLES } from "@/lib/pattern-domain";
import { getPatternBySlug, listPublishedPatterns } from "@/lib/patterns";

export const revalidate = 3600;

type PatternPageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const patterns = await listPublishedPatterns();

  return patterns.map((pattern) => ({ slug: pattern.slug }));
}

export async function generateMetadata({ params }: PatternPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pattern = await getPatternBySlug(slug);

  if (!pattern) {
    return { title: "Выкройка не найдена", robots: { index: false, follow: false } };
  }

  return {
    title: pattern.title,
    description: pattern.description,
    alternates: { canonical: `/patterns/${pattern.slug}` },
    openGraph: {
      type: "article",
      title: pattern.title,
      description: pattern.description,
      url: `/patterns/${pattern.slug}`,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: pattern.title }],
    },
  };
}

export default async function PatternPage({ params }: PatternPageProps) {
  const { slug } = await params;
  const pattern = await getPatternBySlug(slug);

  if (!pattern) notFound();

  const sizesRange = `${pattern.sizes[0]?.label ?? "—"}–${pattern.sizes.at(-1)?.label ?? "—"}`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <nav aria-label="Хлебные крошки" className="text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          Главная
        </Link>
        <span aria-hidden="true" className="px-2 text-line">
          /
        </span>
        <Link href="/catalog" className="transition-colors hover:text-foreground">
          Каталог
        </Link>
        <span aria-hidden="true" className="px-2 text-line">
          /
        </span>
        <span className="text-foreground">{pattern.title}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
        <div className="min-w-0">
          <div className="overflow-hidden rounded-3xl border border-line bg-card">
            <PatternCover
              slug={pattern.slug}
              coverUrl={pattern.coverUrl}
              alt={`${pattern.title} — фото готового изделия`}
              className="aspect-[4/3] w-full"
            />
          </div>

          <section aria-labelledby="description-title" className="mt-8">
            <h2 id="description-title" className="font-display text-2xl">
              Описание
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
              {pattern.description}
            </p>
          </section>

          <section aria-labelledby="kit-title" className="mt-8">
            <h2 id="kit-title" className="font-display text-2xl">
              Состав набора
            </h2>
            <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {pattern.materials.map((material) => (
                <li key={material} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                  />
                  <span>{material}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-5 grid gap-4 rounded-2xl border border-line bg-card p-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Ткань</dt>
                <dd className="mt-1 leading-relaxed">{pattern.fabricNote}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Припуски</dt>
                <dd className="mt-1 leading-relaxed">{pattern.allowances}</dd>
              </div>
            </dl>
          </section>
        </div>

        <aside className="min-w-0 space-y-6 lg:sticky lg:top-24">
          <div className="rounded-3xl border border-line bg-card p-6">
            <Badge variant="outline">{CATEGORY_TITLES[pattern.categorySlug]}</Badge>

            <h1 className="mt-3 font-display text-3xl leading-tight tracking-tight text-balance sm:text-4xl">
              {pattern.title}
            </h1>

            <p className="mt-4 font-display text-3xl text-primary">{formatPrice(pattern.price)}</p>

            <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line/70 pt-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Сложность</dt>
                <dd className="mt-0.5 font-medium">{getLevelLabel(pattern.level)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Время пошива</dt>
                <dd className="mt-0.5 font-medium">{formatSewingHours(pattern.sewingHours)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Размеры</dt>
                <dd className="mt-0.5 font-medium">{sizesRange}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Формат лекал</dt>
                <dd className="mt-0.5 font-medium">PDF A4</dd>
              </div>
            </dl>

            <a
              href="#size-panel"
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Выбрать размер
            </a>

            <div className="mt-3">
              <FavoriteButton patternId={pattern.id} patternSlug={pattern.slug} />
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Лекала уже с припусками. После покупки выкройка появится в личном кабинете, а PDF
              можно будет скачать и распечатать на A4.
            </p>

            <a
              href="#size-fit"
              className="mt-3 block text-center text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Не знаете размер? Подберите по меркам
            </a>
          </div>

          <SizePanel sizes={pattern.sizes} />
        </aside>
      </div>

      <div className="mt-12">
        <SizeFitSection sizes={pattern.sizes} categorySlug={pattern.categorySlug} />
      </div>
    </div>
  );
}
