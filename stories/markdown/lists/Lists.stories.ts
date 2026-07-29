import type { Meta, StoryObj } from "@storybook/svelte-vite";
import EditorModeStory from "../_shared/EditorModeStory.svelte";
import MarkdownPreviewStory from "../_shared/MarkdownPreviewStory.svelte";
import {
  markdownEditorDocsSource,
  markdownPreviewDocsSource,
} from "../_shared/docs-source";
import { defineMiraExtension } from "@mira-mde/extensions";
import { listCalloutsMarkdown, listsMarkdown } from "../fixtures";

const listCalloutCatalogExtension = defineMiraExtension({
  name: "storybook-list-callout-catalog",
  listCallouts: [
    { char: "^", color: "99, 102, 241" },
    { char: "%", enabled: false },
  ],
});

const meta = {
  title: "Markdown/Lists",
  component: MarkdownPreviewStory,
  args: {
    value: listsMarkdown,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Ordered and unordered lists keep nested alignment and wrapping.",
      },
      source: {
        language: "html",
        type: "code",
        code: markdownPreviewDocsSource("listsMarkdown"),
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
        code: markdownEditorDocsSource("listsMarkdown", "live-preview"),
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
        code: markdownEditorDocsSource("listsMarkdown", "source"),
      },
    },
  },
};

export const CustomCalloutCatalog: Story = {
  name: "Custom List Callout Catalog",
  args: {
    value: listCalloutsMarkdown,
    extensions: [listCalloutCatalogExtension],
  },
  tags: ["visual-pending"],
  parameters: {
    docs: {
      source: {
        language: "ts",
        type: "code",
        code: `const listCallouts = defineMiraExtension({
  name: "list-callouts",
  listCallouts: [
    { char: "^", color: "99, 102, 241" },
    { char: "%", enabled: false },
  ],
});

<MarkdownPreview
  value={listCalloutsMarkdown}
  extensions={[listCallouts]}
/>`,
      },
    },
  },
};

export const CustomCalloutCatalogLive: Story = {
  name: "Custom List Callout Catalog Live Preview",
  render: (args) => ({
    Component: EditorModeStory,
    props: {
      ...args,
      value: listCalloutsMarkdown,
      extensions: [listCalloutCatalogExtension],
      mode: "live-preview",
    },
  }),
  tags: ["visual-pending"],
};
