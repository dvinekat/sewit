import { FileDown, Ruler, Scissors, ShieldCheck } from "lucide-react";

const BENEFITS = [
  {
    icon: Ruler,
    title: "Размер по меркам",
    text: "ОГ, ОТ, ОБ и рост. SewIt рекомендует размер и предупреждает, если понадобится подгонка.",
  },
  {
    icon: Scissors,
    title: "Пресеты модели",
    text: "Длина, рукав, вырез и посадка. Вы выбираете вариант из готовых лекал, а не режете на глаз.",
  },
  {
    icon: FileDown,
    title: "PDF A4",
    text: "Лекала с тестовой страницей масштаба — печатайте дома без настройки «по размеру страницы».",
  },
  {
    icon: ShieldCheck,
    title: "Без подписки",
    text: "Одна покупка — доступ к купленным лекалам в личном кабинете без ежемесячных платежей.",
  },
];

export function Benefits() {
  return (
    <section aria-labelledby="benefits-title" className="border-b border-line/70">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <h2 id="benefits-title" className="sr-only">
          Что даёт SewIt
        </h2>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="group flex h-full flex-col gap-3 rounded-2xl border border-line bg-card p-5 transition-colors hover:border-primary/30"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-sage-soft text-sage">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <h3 className="font-display text-lg text-foreground">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
