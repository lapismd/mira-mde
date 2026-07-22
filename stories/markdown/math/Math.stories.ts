import type { Meta, StoryObj } from "@storybook/svelte-vite";
import EditorModeStory from "../_shared/EditorModeStory.svelte";
import MarkdownPreviewStory from "../_shared/MarkdownPreviewStory.svelte";
import {
  markdownEditorDocsSource,
  markdownPreviewDocsSource,
} from "../_shared/docs-source";
import { mathMarkdown } from "../fixtures";

const meta = {
  title: "Markdown/Math",
  component: MarkdownPreviewStory,
  args: {
    value: mathMarkdown,
  },
  parameters: {
    docs: {
      description: {
        component: "Inline and block KaTeX math rendering.",
      },
      source: {
        language: "html",
        type: "code",
        code: markdownPreviewDocsSource("mathMarkdown"),
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
        language: "html",
        type: "code",
        code: markdownEditorDocsSource("mathMarkdown", "live-preview"),
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
        language: "html",
        type: "code",
        code: markdownEditorDocsSource("mathMarkdown", "source"),
      },
    },
  },
};
