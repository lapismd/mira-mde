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
        language: "html",
        type: "code",
        code: markdownPreviewDocsSource("rawHtmlMarkdown"),
      },
    },
  },
} satisfies Meta<typeof MarkdownPreviewStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {
  tags: [
    "visual-ready",
    "!visual-pending",
    "!visual-approved",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/raw-html/preview-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
};

export const LivePreview: Story = {
  tags: [
    "visual-ready",
    "!visual-pending",
    "!visual-approved",
    "!visual-failed",
  ],
  name: "Live Preview",
  render: (args) => ({
    Component: EditorModeStory,
    props: {
      ...args,
      mode: "live-preview",
    },
  }),
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/raw-html/live-preview-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
    docs: {
      source: {
        language: "html",
        type: "code",
        code: markdownEditorDocsSource("rawHtmlMarkdown", "live-preview"),
      },
    },
  },
};

export const SourceMode: Story = {
  tags: [
    "visual-ready",
    "!visual-pending",
    "!visual-approved",
    "!visual-failed",
  ],
  name: "Source Mode",
  render: (args) => ({
    Component: EditorModeStory,
    props: {
      ...args,
      mode: "source",
    },
  }),
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/raw-html/source-mode-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
    docs: {
      source: {
        language: "html",
        type: "code",
        code: markdownEditorDocsSource("rawHtmlMarkdown", "source"),
      },
    },
  },
};
