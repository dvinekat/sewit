import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // worker_threads вместо дочерних процессов: тесты не требуют spawn с pipe.
    pool: "threads",
  },
});
