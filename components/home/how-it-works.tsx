import { SectionHeading } from "@/components/section-heading";

const STEPS = [
  {
    number: "01",
    title: "Выбираете модель",
    text: "Каталог с категориями, фильтрами по размеру и сложности и сортировкой по цене.",
  },
  {
    number: "02",
    title: "Вводите мерки",
    text: "ОГ, ОТ, ОБ и рост. Система предлагает размер и предупреждает о пограничных случаях.",
  },
  {
    number: "03",
    title: "Настраиваете пресет",
    text: "Длина, рукав, вырез и посадка. Состав набора и цена обновляются сразу.",
  },
  {
    number: "04",
    title: "Скачиваете PDF A4",
    text: "После оплаты лекала появляются в библиотеке — с мерками на титульном листе.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="scroll-mt-24 border-b border-line/70"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeading
          id="how-it-works-title"
          eyebrow="Как это работает"
          title="От мерок до готовых лекал — четыре шага"
          description="Сценарий рассчитан на новичка: без конструкторских расчётов и подгонки «на глаз»."
        />

        <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <li
              key={step.number}
              className="relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-line bg-card p-6"
            >
              <span
                aria-hidden="true"
                className="font-display text-4xl leading-none text-primary/25"
              >
                {step.number}
              </span>
              <h3 className="font-display text-lg text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
