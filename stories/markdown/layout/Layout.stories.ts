import type { Meta, StoryObj } from "@storybook/svelte-vite";
import EditorModeStory from "../_shared/EditorModeStory.svelte";
import layoutShowcaseMarkdown from "./CodeMirror Layout Showcase.md?raw";

const meta = {
  title: "Markdown/Layout Parity",
  component: EditorModeStory,
  tags: ["visual-pending"],
  args: {
    height: "44rem",
    sourcePath: "showcase.md",
    value: layoutShowcaseMarkdown,
  },
  parameters: {
    docs: {
      description: {
        component:
          "A shared regression fixture for mode-position continuity, wrapped indentation, gutter alignment, and explicit text-fence geometry.",
      },
      source: {
        language: "html",
        type: "code",
        code: `<MiraEditor
  bind:value
  bind:mode
  sourcePath="showcase.md"
  lineWrapping
  indentGuides
/>`,
      },
    },
  },
} satisfies Meta<typeof EditorModeStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LivePreview: Story = {
  tags: ["visual-approved", "!visual-pending", "!visual-ready", "!visual-failed"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/layout/live-preview-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Live Preview",
  args: { mode: "live-preview" },
};

export const Source: Story = {
  tags: ["visual-approved", "!visual-pending", "!visual-ready", "!visual-failed"],
  parameters: {
    visualDelta: {
      images: ["/visual-baselines/stories/markdown/layout/source-chromium.png"],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  args: { mode: "source" },
};

export const Preview: Story = {
  tags: ["visual-approved", "!visual-pending", "!visual-ready", "!visual-failed"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/layout/preview-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  args: { mode: "preview" },
};

export const Split: Story = {
  tags: ["visual-approved", "!visual-pending", "!visual-ready", "!visual-failed"],
  parameters: {
    visualDelta: {
      images: ["/visual-baselines/stories/markdown/layout/split-chromium.png"],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  args: { mode: "split" },
};

export const NarrowSource: Story = {
  tags: ["visual-approved", "!visual-pending", "!visual-ready", "!visual-failed"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/layout/narrow-source-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Narrow Source Geometry",
  args: { mode: "source", width: "36rem" },
};

export const WideSource: Story = {
  tags: ["visual-approved", "!visual-pending", "!visual-ready", "!visual-failed"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/layout/wide-source-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Wide Source Geometry",
  args: { mode: "source", width: "72rem" },
};
