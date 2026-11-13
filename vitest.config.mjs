import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Тот же алиас, что в tsconfig (`@/*` → корень репозитория).
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // worker_threads вместо дочерних процессов: тесты не требуют spawn с pipe.
    pool: "threads",
  },
});
