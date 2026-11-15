import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Как печатать A4 без масштабирования",
  description:
    "Памятка SewIt: как распечатать лекала A4 в масштабе 100%, проверить контрольный квадрат 10×10 см и склеить листы.",
  alternates: { canonical: "/help/printing" },
};

const MISTAKES = [
  "«По размеру страницы» или «Fit to page» — принтер сжимает чертёж, и лекало становится меньше.",
  "Масштаб 97–98% по умолчанию в некоторых драйверах — проверяйте поле «Масштаб».",
  "Поля «Минимум» съедают рамку с метками — ставьте «Нет» там, где принтер это позволяет.",
  "Печать на A3 или Legal без пересчёта: формат бумаги в диалоге должен быть A4.",
];

/**
 * Памятка по печати лекал (T-45, FR-7.4).
 *
 * Контрольный квадрат 10×10 см свёрстан в миллиметрах: если принтер печатает
 * в масштабе 100%, квадрат совпадёт с линейкой. Это и есть проверка масштаба,
 * которую обещает README (тестовая страница T-C03).
 */
export default function PrintingGuidePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <nav aria-label="Хлебные крошки" className="text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          Главная
        </Link>
        <span aria-hidden="true" className="px-2 text-line">
          /
        </span>
        <span className="text-foreground">Как печатать A4</span>
      </nav>

      <header className="mt-6 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Памятка по печати
        </p>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
          Как печатать лекала A4 без масштабирования
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Лекала SewIt рассчитаны на печать в натуральную величину. Если принтер уменьшит чертёж,
          изделие сядет меньше на 2–4 см — поэтому масштаб нужно проверить до раскроя.
        </p>
      </header>

      <section aria-labelledby="scale" className="mt-8 space-y-3">
        <h2 id="scale" className="font-display text-2xl">
          1. Масштаб 100%, а не «по размеру страницы»
        </h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>Откройте PDF в Adobe Acrobat Reader, другом просмотрщике или браузере.</li>
          <li>
            В диалоге печати выберите принтер и формат бумаги <strong>A4</strong>.
          </li>
          <li>
            В разделе «Размер и обработка страниц» выберите{" "}
            <strong>«Фактический размер» / «Actual size»</strong> или задайте масштаб{" "}
            <strong>100%</strong>.
          </li>
          <li>Поля (Margins) — «Нет» или «Минимум», чтобы не обрезать метки совмещения.</li>
          <li>Печать в оттенках серого допустима: линии чертежа останутся читаемыми.</li>
        </ol>
        <p className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm leading-relaxed">
          Совет: сначала напечатайте одну страницу с контрольным квадратом и проверьте её линейкой.
        </p>
      </section>

      <section aria-labelledby="square" className="mt-8 space-y-4">
        <h2 id="square" className="font-display text-2xl">
          2. Проверьте контрольный квадрат 10×10 см
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Распечатайте эту страницу и приложите линейку к квадрату ниже. Если стороны отличаются от
          10 см хотя бы на 1–2 мм — вернитесь к настройкам масштаба.
        </p>

        <div className="rounded-2xl border border-line bg-card p-6">
          <div
            role="img"
            aria-label="Контрольный квадрат: 10 на 10 сантиметров при печати в масштабе 100 процентов"
            className="relative border-2 border-primary bg-secondary/30"
            style={{ width: "100mm", height: "100mm" }}
          >
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-sm text-muted-foreground">
              10 × 10 см
            </span>
            <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-primary/20" />
            <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px bg-primary/20" />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            На экране размер приблизительный — ориентируйтесь именно на распечатанный лист.
          </p>
        </div>
      </section>

      <section aria-labelledby="glue" className="mt-8 space-y-3">
        <h2 id="glue" className="font-display text-2xl">
          3. Как склеить листы
        </h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>Разложите листы по номерам страниц, указанным в углу каждого листа.</li>
          <li>Совместите рамки и контрольные метки на соседних листах, не обрезая поля заранее.</li>
          <li>Склейте скотчем с лицевой стороны по стыку, затем подрежьте лишнее.</li>
          <li>
            Сверьте собранный чертёж: линии должны быть непрерывными, а контрольный квадрат — ровно
            10×10 см.
          </li>
        </ol>
      </section>

      <section aria-labelledby="mistakes" className="mt-8 space-y-3">
        <h2 id="mistakes" className="font-display text-2xl">
          4. Частые ошибки
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          {MISTAKES.map((mistake) => (
            <li key={mistake}>{mistake}</li>
          ))}
        </ul>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/catalog" className={cn(buttonVariants({ size: "default" }))}>
          В каталог
        </Link>
        <Link href="/account/library" className={cn(buttonVariants({ variant: "outline" }))}>
          Мои выкройки
        </Link>
        <Link
          href="/patterns/slip-dress/instructions"
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          Пример инструкции
        </Link>
      </div>
    </div>
  );
}
