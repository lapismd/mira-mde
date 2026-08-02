import type { Preview } from "@storybook/svelte-vite";
import "@lapismd/mira-editor/styles.css";
import "../stories/markdown/_shared/storybook.css";
import { installFocusPrototypeGuard } from "./focus-prototype-guard";

// Guard Storybook 10.5 focus instrumentation before Docs/react-aria wraps it.
installFocusPrototypeGuard();

const preview: Preview = {
  tags: ["autodocs", "test"],
  globalTypes: {
    theme: {
      description: "Color theme",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  decorators: [
    (story, context) => {
      // Re-apply if Storybook installed its accessor after the first attempt.
      installFocusPrototypeGuard();
      if (typeof document !== "undefined") {
        const theme = context.globals.theme === "dark" ? "dark" : "light";
        document.documentElement.dataset.theme = theme;
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.classList.toggle(
          "mira-theme-dark",
          theme === "dark",
        );
        document.documentElement.classList.toggle(
          "mira-theme-light",
          theme === "light",
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
    layout: "fullscreen",
  },
};

export default preview;
