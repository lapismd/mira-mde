import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, within } from "storybook/test";
import EditorModeStory from "../_shared/EditorModeStory.svelte";
import MarkdownPreviewStory from "../_shared/MarkdownPreviewStory.svelte";
import {
  markdownEditorDocsSource,
  markdownPreviewDocsSource,
} from "../_shared/docs-source";
import { defineMiraExtension } from "@lapismd/mira/extensions";
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

export const Preview: Story = {
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: ["/visual-baselines/stories/markdown/lists/preview-chromium.png"],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
};

export const LivePreview: Story = {
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
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
        "/visual-baselines/stories/markdown/lists/live-preview-chromium.png",
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
        code: markdownEditorDocsSource("listsMarkdown", "live-preview"),
      },
    },
  },
};

export const SourceMode: Story = {
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
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
        "/visual-baselines/stories/markdown/lists/source-mode-chromium.png",
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
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/lists/custom-callout-catalog-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.queryByRole("button", { name: /Change list highlight/u }),
    ).not.toBeInTheDocument();
    await expect(
      canvasElement.querySelectorAll("[data-list-callout-marker]"),
    ).toHaveLength(4);
  },
};

export const CustomCalloutCatalogLive: Story = {
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/lists/custom-callout-catalog-live-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Custom List Callout Catalog Live Preview",
  render: (args) => ({
    Component: EditorModeStory,
    props: {
      ...args,
      value: listCalloutsMarkdown,
      extensions: [listCalloutCatalogExtension],
      mode: "live-preview",
      exposeValue: true,
    },
  }),
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "Change list highlight (&)" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Change list highlight (@)" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Change list highlight (?)" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Change list highlight (^)" }),
    ).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "Change list highlight (%)" }),
    ).not.toBeInTheDocument();
  },
};
