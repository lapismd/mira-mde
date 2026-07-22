import type { Preview } from "@storybook/svelte-vite";
import "@mira-mde/default-ui/styles.css";
import "../stories/markdown/_shared/storybook.css";
import {
  baselineUrlForStory,
  visualBaselineVisualDeltaParameter,
} from "./visual-baseline-design";

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

      if (!context.parameters.visualDelta) {
        const baseline = baselineUrlForStory({
          title: context.title,
          id: context.id,
          tags: context.tags,
        });
        if (baseline) {
          context.parameters.visualDelta =
            visualBaselineVisualDeltaParameter(baseline);
        }
      }

      return story();
    },
  ],
  parameters: {
    a11y: {
      test: "todo",
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
