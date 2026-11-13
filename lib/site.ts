/**
 * Константы сайта: один источник для метаданных, OG и футера.
 * URL берётся из NEXT_PUBLIC_SITE_URL (README 8.4); без переменной — локальный адрес.
 */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const site = {
  name: "SewIt",
  title: "SewIt — выкройки, которые садятся по вашей фигуре",
  tagline: "Выкройки, которые садятся по вашей фигуре",
  description:
    "SewIt — магазин готовых выкроек: подбор размера по меркам, пресеты модели и лекала PDF A4 для печати дома.",
  url: siteUrl,
  locale: "ru_RU",
  language: "ru",
  creator: "SewIt",
} as const;
