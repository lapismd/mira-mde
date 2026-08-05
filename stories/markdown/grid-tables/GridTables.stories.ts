import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { catalogParameters } from "../../catalog/catalog.mjs";
import EditorModeStory from "../_shared/EditorModeStory.svelte";
import MarkdownPreviewStory from "../_shared/MarkdownPreviewStory.svelte";
import {
  markdownEditorDocsSource,
  markdownPreviewDocsSource,
} from "../_shared/docs-source";
import { gridTablesMarkdown } from "../fixtures";

const meta = {
  title: "Markdown/Grid Tables",
  component: MarkdownPreviewStory,
  args: {
    value: gridTablesMarkdown,
  },
  parameters: {
    ...catalogParameters("tables"),
    docs: {
      description: {
        component:
          "Grid tables use explicit boundaries for spans, sections, and alignment.",
      },
      source: {
        language: "html",
        type: "code",
        code: markdownPreviewDocsSource("gridTablesMarkdown"),
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
        "/visual-baselines/stories/markdown/grid-tables/preview-chromium.png",
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
        "/visual-baselines/stories/markdown/grid-tables/live-preview-chromium.png",
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
        code: markdownEditorDocsSource("gridTablesMarkdown", "live-preview"),
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
        "/visual-baselines/stories/markdown/grid-tables/source-mode-chromium.png",
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
        code: markdownEditorDocsSource("gridTablesMarkdown", "source"),
      },
    },
  },
};
