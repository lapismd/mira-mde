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
    "@storybook/addon-themes",
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
        include: [
          "@storybook/addon-themes",
          "@lucide/svelte/icons/align-vertical-justify-center",
          "@lucide/svelte/icons/align-vertical-justify-end",
          "@lucide/svelte/icons/align-vertical-justify-start",
          "@lucide/svelte/icons/arrow-up-down",
          "@lucide/svelte/icons/columns-3",
          "@lucide/svelte/icons/eraser",
          "@lucide/svelte/icons/indent-increase",
          "@lucide/svelte/icons/list-ordered",
          "@lucide/svelte/icons/list-tree",
          "@lucide/svelte/icons/move",
          "@lucide/svelte/icons/plus",
          "@lucide/svelte/icons/repeat-2",
          "@lucide/svelte/icons/rows-3",
          "@lucide/svelte/icons/space",
          "@lucide/svelte/icons/trash-2",
          "@lucide/svelte/icons/wrap-text",
        ],
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
