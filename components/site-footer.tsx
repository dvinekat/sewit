import Link from "next/link";

import { Logo } from "@/components/logo";

const LINKS = [
  { href: "/", label: "Главная" },
  { href: "/catalog", label: "Каталог выкроек" },
  { href: "/help/printing", label: "Как печатать A4" },
  { href: "/#how-it-works", label: "Как это работает" },
  { href: "/#about", label: "О SewIt" },
];

const LEGAL_LINKS = [
  { href: "/legal/privacy", label: "Политика ПД" },
  { href: "/legal/terms", label: "Публичная оферта" },
  { href: "/legal/refund", label: "Возврат цифрового товара" },
];

const CUSTOMER_INFO = [
  "Размеры 42, 46, 48 и 50",
  "Формат лекал: PDF A4",
  "Доступ к покупкам в личном кабинете",
];

/** Подвал витрины: разделы, информация покупателю и правовые документы (T-44). */
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-secondary/40">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              SewIt — выкройки для домашнего шитья: подбор размера по меркам, пресеты модели и
              лекала PDF A4 для печати дома.
            </p>
          </div>

          <nav aria-label="Разделы сайта" className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Разделы
            </h2>
            <ul className="space-y-2 text-sm">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-foreground/80 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Покупателям
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {CUSTOMER_INFO.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <nav aria-label="Правовая информация" className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Документы
            </h2>
            <ul className="space-y-2 text-sm">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-foreground/80 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 SewIt. Учебный проект: демо-оплата, деньги не списываются.</p>
          <p>Онлайн-студия выкроек</p>
        </div>
      </div>
    </footer>
  );
}
