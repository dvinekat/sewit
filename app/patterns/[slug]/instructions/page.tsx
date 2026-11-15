import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { formatSewingHours, getLevelLabel } from "@/lib/format";
import { getPatternInstruction } from "@/lib/instructions";
import { parseInstructionMarkdown, type InstructionBlock } from "@/lib/instructions-format";
import { getPatternBySlug } from "@/lib/patterns";
import { cn } from "@/lib/utils";

export const revalidate = 3600;

type InstructionsPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: InstructionsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pattern = await getPatternBySlug(slug);

  if (!pattern) {
    return { title: "Инструкция не найдена", robots: { index: false, follow: false } };
  }

  return {
    title: `Инструкция: ${pattern.title}`,
    description: `Пошаговая инструкция пошива модели «${pattern.title}»: раскрой, сборка, обработка швов и примерка.`,
    alternates: { canonical: `/patterns/${pattern.slug}/instructions` },
  };
}

function InstructionBlocks({ blocks }: { blocks: InstructionBlock[] }) {
  return (
    <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
      {blocks.map((block, index) => {
        if (block.kind === "heading") {
          return (
            <h2 key={index} className="mt-6 font-display text-xl text-foreground first:mt-0">
              {block.text}
            </h2>
          );
        }

        if (block.kind === "list") {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          );
        }

        if (block.kind === "note") {
          return (
            <p key={index} className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              {block.text}
            </p>
          );
        }

        return <p key={index}>{block.text}</p>;
      })}
    </div>
  );
}

/**
 * Страница инструкции пошива (T-45, FR-9.1).
 *
 * Если администратор заполнил `instructions.content_md`, показываем его.
 * Для моделей без текста работает базовый порядок пошива с данными выкройки
 * (ткань, материалы, припуски) — страница не бывает пустой.
 */
export default async function InstructionsPage({ params }: InstructionsPageProps) {
  const { slug } = await params;
  const pattern = await getPatternBySlug(slug);

  if (!pattern) notFound();

  const instruction = await getPatternInstruction(pattern.id);
  const blocks = instruction ? parseInstructionMarkdown(instruction.contentMd) : [];

  const baseSteps = [
    {
      title: "Распечатайте лекала",
      text: "Скачайте PDF A4 из библиотеки и печатайте в масштабе 100% без полей. Проверьте контрольный квадрат 10×10 см.",
    },
    {
      title: "Снимите мерки и сверьтесь с таблицей",
      text: "Сравните ОГ, ОТ, ОБ и рост с таблицей размеров модели. Если мерки между размерами — ориентируйтесь на больший и подгоняйте на примерке.",
    },
    {
      title: "Подготовьте ткань",
      text: `Ткань: ${pattern.fabricNote}. Продекатируйте и сложите по направлению долевой нити.`,
    },
    {
      title: "Выкроите детали",
      text: `Разложите лекала, приколите и вырежьте. Припуски: ${pattern.allowances}.`,
    },
    {
      title: "Сметайте и примерьте",
      text: "Сколите или сметайте основные швы, наденьте изделие, проверьте линию талии, длину и посадку. Все правки — на этом этапе.",
    },
    {
      title: "Стачайте и обработайте швы",
      text: "Проложите машинные швы, обметайте срезы, вшейте молнию или обработайте застёжку по модели. Приутюжьте каждый шов сразу после стачивания.",
    },
    {
      title: "ВТО и финиш",
      text: "Выполните влажно-тепловую обработку изделия целиком: разутюжьте швы, отпарьте срезы. Только после этого подшивайте низ — так он ляжет ровно.",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <nav aria-label="Хлебные крошки" className="text-sm text-muted-foreground">
        <Link
          href={`/patterns/${pattern.slug}`}
          className="transition-colors hover:text-foreground"
        >
          {pattern.title}
        </Link>
        <span aria-hidden="true" className="px-2 text-line">
          /
        </span>
        <span className="text-foreground">Инструкция</span>
      </nav>

      <header className="mt-6 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Инструкция пошива
        </p>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{pattern.title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Сложность: {getLevelLabel(pattern.level)} · время пошива:{" "}
          {formatSewingHours(pattern.sewingHours)} · лекала PDF A4
        </p>
      </header>

      <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed">
        Это учебный проект: инструкция справочная и не заменяет консультацию конструктора. Перед
        раскроем обязательно проверьте масштаб печати.
      </div>

      {blocks.length > 0 ? (
        <InstructionBlocks blocks={blocks} />
      ) : (
        <>
          <p className="mt-6 rounded-2xl border border-line bg-card p-4 text-sm leading-relaxed text-muted-foreground">
            Подробный текст для этой модели ещё готовится — ниже базовый порядок пошива SewIt. Он
            подходит для любой модели каталога, а данные ткани и припусков взяты из её карточки.
          </p>

          <ol className="mt-6 space-y-4">
            {baseSteps.map((step, index) => (
              <li key={step.title} className="rounded-2xl border border-line bg-card p-4">
                <p className="font-display text-lg">
                  {index + 1}. {step.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>

          <section
            aria-labelledby="materials"
            className="mt-6 rounded-2xl border border-line bg-card p-4"
          >
            <h2 id="materials" className="font-display text-lg">
              Что понадобится
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {pattern.materials.map((material) => (
                <li key={material}>{material}</li>
              ))}
            </ul>
          </section>
        </>
      )}

      {instruction?.videoUrl ? (
        <p className="mt-6 text-sm">
          <a
            href={instruction.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            Видеоинструкция к модели
          </a>
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/help/printing" className={cn(buttonVariants({ variant: "outline" }))}>
          Как печатать A4
        </Link>
        <Link
          href={`/patterns/${pattern.slug}`}
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          Вернуться к карточке
        </Link>
      </div>
    </div>
  );
}
