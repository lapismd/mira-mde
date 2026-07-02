import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [svelte({ preprocess: vitePreprocess() })],
  resolve: {
    alias: {
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
