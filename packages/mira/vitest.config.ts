import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [svelte({ preprocess: vitePreprocess() })],
  resolve: {
    conditions: ["browser"],
    alias: [
      {
        find: /^@lapismd\/mira\/core$/,
        replacement: fileURLToPath(
          new URL("./src/core/index.ts", import.meta.url),
        ),
      },
      {
        find: /^@lapismd\/mira\/extensions$/,
        replacement: fileURLToPath(
          new URL("./src/extensions/index.ts", import.meta.url),
        ),
      },
      {
        find: /^@lapismd\/mira\/codemirror$/,
        replacement: fileURLToPath(
          new URL("./src/codemirror.ts", import.meta.url),
        ),
      },
      {
        find: /^@lapismd\/mira\/preview$/,
        replacement: fileURLToPath(
          new URL("./src/preview/index.ts", import.meta.url),
        ),
      },
      {
        find: /^@lapismd\/mira\/tables$/,
        replacement: fileURLToPath(
          new URL("./src/tables/index.ts", import.meta.url),
        ),
      },
      {
        find: /^@lapismd\/mira\/ui\/table-dnd\/sensors$/,
        replacement: fileURLToPath(
          new URL("./src/ui/table-dnd/table-dnd-sensors.ts", import.meta.url),
        ),
      },
      {
        find: /^@lapismd\/mira\/ui\/table-dnd\/utils$/,
        replacement: fileURLToPath(
          new URL("./src/ui/table-dnd/table-dnd-utils.ts", import.meta.url),
        ),
      },
      {
        find: /^@lapismd\/mira\/ui(\/.*)?$/,
        replacement: `${fileURLToPath(new URL("./src/ui", import.meta.url))}$1`,
      },
      {
        find: /^@lapismd\/mira$/,
        replacement: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      },
    ],
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    exclude: ["dist/**", ".svelte-kit/**"],
    setupFiles: ["src/test-setup.ts"],
  },
});
