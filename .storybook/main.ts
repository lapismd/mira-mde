import type { StorybookConfig } from "@storybook/svelte-vite";
import type { Plugin } from "vite";
import { createRequire } from "node:module";
import path from "node:path";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { mergeConfig } from "vite";
import { visualBaselineVisualDeltaPlugin } from "./visual-baseline-vite-plugin.ts";
import { visualDeltaMiddlewarePlugin } from "./visual-delta-middleware.ts";

const require = createRequire(import.meta.url);
const visualDeltaPackageRoot = path.dirname(
  require.resolve("storybook-addon-visual-delta/package.json"),
);
const visualDeltaSrc = path.join(visualDeltaPackageRoot, "src");

function watchVisualDeltaSourcePlugin(): Plugin {
  return {
    name: "watch-visual-delta-source",
    configureServer(server) {
      server.watcher.add(visualDeltaSrc);
      server.watcher.on("change", (file) => {
        if (!file.startsWith(visualDeltaSrc)) return;
        server.ws.send({ type: "full-reload", path: "*" });
      });
    },
  };
}

const config: StorybookConfig = {
  stories: ["../stories/**/*.mdx", "../stories/**/*.stories.@(js|ts|svelte)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-svelte-csf",
    "@storybook/addon-vitest",
    "@storybook/addon-mcp",
    import.meta.resolve("./visual-delta-preset.ts"),
    "storybook-addon-tag-badges",
  ],
  staticDirs: [
    {
      from: "../tests/visual/storybook.spec.ts-snapshots",
      to: "/visual-baselines",
    },
    {
      from: "../stories/static",
      to: "/",
    },
  ],
  framework: {
    name: "@storybook/svelte-vite",
    options: {},
  },
  viteFinal: async (viteConfig) => {
    const plugins = viteConfig.plugins ?? [];
    viteConfig.plugins = [
      visualBaselineVisualDeltaPlugin(),
      visualDeltaMiddlewarePlugin(),
      watchVisualDeltaSourcePlugin(),
      // Explicit Svelte plugin — framework auto-wiring can miss compile in this
      // monorepo (PreviewRender.svelte then hits vite import-analysis raw).
      svelte({
        preprocess: vitePreprocess(),
        compilerOptions: {
          runes: undefined,
        },
      }),
      ...plugins,
    ];
    return mergeConfig(viteConfig, {
      resolve: {
        alias: {
          "storybook-addon-visual-delta": visualDeltaPackageRoot,
        },
      },
      optimizeDeps: {
        exclude: ["storybook-addon-visual-delta", "@storybook/svelte"],
      },
      server: {
        watch: {
          ignored: ["**/storybook-static/**"],
        },
      },
    });
  },
};

export default config;
