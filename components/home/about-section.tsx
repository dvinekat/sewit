import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

const PRINCIPLES = [
  "Посадка по меркам, а не по ощущениям",
  "Понятный расход ткани и материалов",
  "Печать A4 без масштабирования",
];

export function AboutSection() {
  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="scroll-mt-24 border-b border-line/70 bg-secondary/30"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:px-8 lg:py-14">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">О SewIt</p>
          <h2
            id="about-title"
            className="font-display text-2xl tracking-tight text-balance sm:text-3xl"
          >
            Студия выкроек для домашнего шитья
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            SewIt — независимая студия выкроек. Мы делаем модели для тех, кто шьёт для себя:
            проверяем посадку на разных фигурах, считаем расход ткани и собираем лекала в PDF A4,
            которые можно напечатать дома.
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Наша цель — чтобы выкройка садилась с первого раза, а не требовала подгонки на глаз.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-sm font-medium text-foreground">Что для нас важно</p>
          <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
            {PRINCIPLES.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sage" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/catalog"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Смотреть выкройки
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
