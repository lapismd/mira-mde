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
        code: `<MiraDefaultMde
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
  name: "Live Preview",
  args: { mode: "live-preview" },
};

export const Source: Story = {
  args: { mode: "source" },
};

export const Preview: Story = {
  args: { mode: "preview" },
};

export const Split: Story = {
  args: { mode: "split" },
};

export const NarrowSource: Story = {
  name: "Narrow Source Geometry",
  args: { mode: "source", width: "36rem" },
};

export const WideSource: Story = {
  name: "Wide Source Geometry",
  args: { mode: "source", width: "72rem" },
};
