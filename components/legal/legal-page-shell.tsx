import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  LEGAL_DISCLAIMER,
  LEGAL_DOC_SLUGS,
  LEGAL_DOCUMENTS,
  LEGAL_UPDATED_AT,
  legalDocHref,
  type LegalDocument,
} from "@/lib/legal-documents";
import { cn } from "@/lib/utils";

/**
 * Общий каркас правовой страницы (T-44, FR-9.2).
 *
 * Дисклеймер об учебном статусе показывается до текста и на каждой странице:
 * без него демо-документы легко принять за реальную оферту.
 */
export function LegalPageShell({ document }: { document: LegalDocument }) {
  const others = LEGAL_DOC_SLUGS.filter((slug) => slug !== document.slug).map(
    (slug) => LEGAL_DOCUMENTS[slug],
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <nav aria-label="Хлебные крошки" className="text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          Главная
        </Link>
        <span aria-hidden="true" className="px-2 text-line">
          /
        </span>
        <span className="text-foreground">{document.title}</span>
      </nav>

      <header className="mt-6 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Правовая информация
        </p>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{document.title}</h1>
        <p className="text-sm text-muted-foreground">Документ обновлён {LEGAL_UPDATED_AT}.</p>
      </header>

      <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed">
        <strong className="font-medium">Учебный статус.</strong> {LEGAL_DISCLAIMER}
      </div>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        {document.sections.map((section) => (
          <section key={section.title} className="space-y-2">
            <h2 className="font-display text-xl text-foreground">{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.list ? (
              <ul className="list-disc space-y-1 pl-5">
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <nav
        aria-label="Другие документы"
        className="mt-10 rounded-2xl border border-line bg-card p-5"
      >
        <h2 className="font-display text-lg">Другие документы</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <Link
              href="/help/printing"
              className="text-foreground/80 underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Как печатать лекала A4 без масштабирования
            </Link>
          </li>
          {others.map((other) => (
            <li key={other.slug}>
              <Link
                href={legalDocHref(other.slug)}
                className="text-foreground/80 underline-offset-4 transition-colors hover:text-primary hover:underline"
              >
                {other.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/register" className={cn(buttonVariants({ variant: "outline" }))}>
          Вернуться к регистрации
        </Link>
        <Link href="/catalog" className={cn(buttonVariants({ variant: "ghost" }))}>
          В каталог
        </Link>
      </div>
    </div>
  );
}
