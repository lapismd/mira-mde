import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [svelte({ preprocess: vitePreprocess() })],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    exclude: ["dist/**"],
    setupFiles: ["src/test-setup.ts"],
  },
});
