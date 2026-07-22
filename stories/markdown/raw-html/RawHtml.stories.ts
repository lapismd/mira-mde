import type { Meta, StoryObj } from "@storybook/svelte-vite";
import EditorModeStory from "../_shared/EditorModeStory.svelte";
import MarkdownPreviewStory from "../_shared/MarkdownPreviewStory.svelte";
import {
  markdownEditorDocsSource,
  markdownPreviewDocsSource,
} from "../_shared/docs-source";
import { rawHtmlMarkdown } from "../fixtures";

const meta = {
  title: "Markdown/Raw HTML",
  component: MarkdownPreviewStory,
  args: {
    value: rawHtmlMarkdown,
  },
  parameters: {
    docs: {
      description: {
        component: "Trusted raw HTML is preserved in preview surfaces.",
      },
      source: {
        language: "svelte",
        type: "code",
        code: markdownPreviewDocsSource("rawHtmlMarkdown"),
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
        code: markdownEditorDocsSource("rawHtmlMarkdown", "live-preview"),
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
        code: markdownEditorDocsSource("rawHtmlMarkdown", "source"),
      },
    },
  },
};
