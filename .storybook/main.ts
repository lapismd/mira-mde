import type { StorybookConfig } from "@storybook/svelte-vite";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.mdx", "../stories/**/*.stories.@(js|ts|svelte)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-svelte-csf",
    "@storybook/addon-vitest",
    "@storybook/addon-mcp",
    {
      name: "@lapismd/storybook-addon-visual-delta",
      options: {
        visualDelta: {
          baselinePathMode: "nested-import",
          snapshotDir: "tests/visual/storybook.spec.ts-snapshots",
        },
      },
    },
    "storybook-addon-tag-badges",
  ],
  staticDirs: [
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
      optimizeDeps: {
        exclude: ["@storybook/svelte"],
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
