import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@mira-mde/codemirror-rich": fileURLToPath(
        new URL("../codemirror-rich/src/block-ranges.ts", import.meta.url),
      ),
      "@mira-mde/extensions": fileURLToPath(
        new URL("../extensions/src/index.ts", import.meta.url),
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
