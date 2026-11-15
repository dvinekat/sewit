import type { Metadata, Viewport } from "next";

import { CookieBanner } from "@/components/legal/cookie-banner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { COOKIE_CONSENT_KEY, COOKIE_CONSENT_VALUE } from "@/lib/cookie-consent";
import { site } from "@/lib/site";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.creator }],
  creator: site.creator,
  keywords: ["выкройки", "выкройки одежды", "лекала PDF", "шитьё", "подбор размера", "SewIt"],
  category: "shopping",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: site.locale,
    url: "/",
    siteName: site.name,
    title: site.title,
    description: site.description,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "SewIt — выкройки, которые садятся по вашей фигуре",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbf8f3",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Отметка о согласии живёт в localStorage, но баннер отрисован в HTML.
  // Скрипт выполняется до первой отрисовки и прячет баннер тем, кто уже принял
  // условия, — без вспышки и без ожидания гидратации.
  const consentScript = `try{if(localStorage.getItem(${JSON.stringify(COOKIE_CONSENT_KEY)})===${JSON.stringify(COOKIE_CONSENT_VALUE)}){document.documentElement.dataset.cookieConsent=${JSON.stringify(COOKIE_CONSENT_VALUE)}}}catch(e){}`;

  return (
    <html lang="ru">
      <body className="flex min-h-dvh flex-col bg-background font-sans text-foreground">
        <script dangerouslySetInnerHTML={{ __html: consentScript }} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
        >
          Перейти к содержимому
        </a>
        {/* Баннер стоит до основного содержимого, хотя и закреплён внизу:
            так браузер рисует его в первом кадре, и он не тормозит LCP. */}
        <CookieBanner />
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
