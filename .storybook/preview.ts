import type { Preview } from "@storybook/svelte-vite";
import { withThemeByDataAttribute } from "@storybook/addon-themes";
import "@lapismd/mira-editor/styles.css";
import "../stories/markdown/_shared/storybook.css";
import { installFocusPrototypeGuard } from "./focus-prototype-guard";

// Guard Storybook 10.5 focus instrumentation before Docs/react-aria wraps it.
installFocusPrototypeGuard();

const preview: Preview = {
  tags: ["autodocs", "test"],
  globalTypes: {
    theme: {
      description: "Mira palette",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "mira", title: "Mira" },
          { value: "obsidian", title: "Obsidian" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "mira",
    colorMode: "light",
  },
  decorators: [
    withThemeByDataAttribute({
      themes: {
        mira: "mira",
        obsidian: "obsidian",
      },
      defaultTheme: "mira",
      attributeName: "data-mira-theme",
    }),
    (story, context) => {
      // Re-apply if Storybook installed its accessor after the first attempt.
      installFocusPrototypeGuard();
      if (typeof document !== "undefined") {
        const colorMode =
          context.globals.colorMode === "dark" ? "dark" : "light";
        document.documentElement.dataset.miraColorMode = colorMode;
        document.documentElement.classList.toggle("dark", colorMode === "dark");
        document.documentElement.classList.toggle(
          "theme-dark",
          colorMode === "dark",
        );
        document.documentElement.classList.toggle(
          "light",
          colorMode === "light",
        );
        document.documentElement.classList.toggle(
          "theme-light",
          colorMode === "light",
        );
      }

      return story();
    },
  ],
  parameters: {
    a11y: {
      test: "error",
      context: {
        exclude: [".cm-gutters"],
      },
    },
    backgrounds: {
      disable: true,
    },
    themes: {
      disable: true,
    },
    layout: "fullscreen",
  },
};

export default preview;
