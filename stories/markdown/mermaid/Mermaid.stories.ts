import type { Meta, StoryObj } from "@storybook/svelte-vite";
import EditorModeStory from "../_shared/EditorModeStory.svelte";
import MarkdownPreviewStory from "../_shared/MarkdownPreviewStory.svelte";
import {
  markdownEditorDocsSource,
  markdownPreviewDocsSource,
} from "../_shared/docs-source";
import { mermaidMarkdownFeature } from "../fixtures";

const meta = {
  title: "Markdown/Mermaid",
  component: MarkdownPreviewStory,
  args: {
    value: mermaidMarkdownFeature,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Mermaid diagrams render inline with Lapis-compatible controls.",
      },
      source: {
        language: "svelte",
        type: "code",
        code: markdownPreviewDocsSource("mermaidMarkdownFeature"),
      },
    },
  },
} satisfies Meta<typeof MarkdownPreviewStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {};

export const LivePreview: Story = {
  name: "Live Preview",
  render: (args) => ({
    Component: EditorModeStory,
    props: {
      ...args,
      mode: "live-preview",
    },
  }),
  parameters: {
    docs: {
      source: {
        language: "svelte",
        type: "code",
        code: markdownEditorDocsSource(
          "mermaidMarkdownFeature",
          "live-preview",
        ),
      },
    },
  },
};

export const SourceMode: Story = {
  name: "Source Mode",
  render: (args) => ({
    Component: EditorModeStory,
    props: {
      ...args,
      mode: "source",
    },
  }),
  parameters: {
    docs: {
      source: {
        language: "svelte",
        type: "code",
        code: markdownEditorDocsSource("mermaidMarkdownFeature", "source"),
      },
    },
  },
};
