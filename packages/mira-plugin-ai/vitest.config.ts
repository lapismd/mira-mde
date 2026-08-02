import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@lapismd/mira/extensions": fileURLToPath(
        new URL("../mira/src/extensions/index.ts", import.meta.url),
      ),
    },
    conditions: ["browser"],
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    exclude: ["dist/**"],
    setupFiles: ["src/test-setup.ts"],
  },
});
