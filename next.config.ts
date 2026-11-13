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
  typescript: {
    // Next запускает tsc дочерним процессом. В изолированном окружении DSH это
    // блокируется (spawn EPERM), поэтому проверка типов вынесена в `pnpm typecheck`.
    // В обычном окружении (CI, локальная машина) флаг не выставлен и сборка типизируется.
    ignoreBuildErrors: process.env.SEWIT_SKIP_BUILD_TYPECHECK === "1",
  },
  experimental: {
    // Сборка страниц в worker_threads вместо дочерних процессов: меньше накладных
    // расходов и совместимость с песочницами, где spawn с pipe запрещён.
    workerThreads: true,
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
