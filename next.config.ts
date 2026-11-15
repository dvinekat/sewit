import type { NextConfig } from "next";

/**
 * Базовые заголовки безопасности из README 8.7.
 * CSP не задаём: инлайновые стили Tailwind и RSC-поток требуют отдельного прохода.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Отдельная папка сборки нужна для проверки production-сборки, пока запущен dev.
  distDir: process.env.SEWIT_DIST_DIR ?? ".next",
  images: {
    // Обложки лежат в публичном бакете `covers` проекта Supabase (README 8.7).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  typescript: {
    // Next запускает tsc дочерним процессом. В изолированном окружении DSH это
    // блокируется (spawn EPERM), поэтому проверка типов вынесена в `pnpm typecheck`.
    // В обычном окружении (CI, локальная машина) флаг не выставлен и сборка типизируется.
    ignoreBuildErrors: process.env.SEWIT_SKIP_BUILD_TYPECHECK === "1",
  },
  // Шрифт для титульного листа PDF должен попасть в serverless-бандл route.
  outputFileTracingIncludes: {
    "/api/download/**": ["./assets/fonts/**/*"],
  },
  experimental: {
    // Сборка страниц в worker_threads вместо дочерних процессов: меньше накладных
    // расходов и совместимость с песочницами, где spawn с pipe запрещён.
    workerThreads: true,
    // Обложка (5 МБ) и PDF лекал (10 МБ) загружаются через server action:
    // поднимаем лимит тела, иначе Next отклонит форму раньше нашей валидации.
    serverActions: { bodySizeLimit: "12mb" },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
