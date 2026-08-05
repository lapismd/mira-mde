import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect } from "storybook/test";
import EditorModeStory from "../_shared/EditorModeStory.svelte";
import MarkdownPreviewStory from "../_shared/MarkdownPreviewStory.svelte";
import {
  markdownEditorDocsSource,
  markdownPreviewDocsSource,
} from "../_shared/docs-source";
import { calloutsMarkdown } from "../fixtures";

const meta = {
  title: "Markdown/Callouts",
  component: MarkdownPreviewStory,
  args: {
    value: calloutsMarkdown,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Obsidian-style callouts with labels, icons, and collapsible state.",
      },
      source: {
        language: "html",
        type: "code",
        code: markdownPreviewDocsSource("calloutsMarkdown"),
      },
    },
  },
} satisfies Meta<typeof MarkdownPreviewStory>;

export default meta;
type Story = StoryObj<typeof meta>;

async function expectRenderedCalloutColors(canvasElement: HTMLElement) {
  const callouts = canvasElement.querySelectorAll<HTMLElement>(".callout");
  await expect(callouts.length).toBeGreaterThan(0);

  const callout = callouts[0];
  const title = callout?.querySelector<HTMLElement>(".callout-title");
  if (!callout || !title) throw new Error("Rendered callout is incomplete");

  const style = getComputedStyle(callout);
  await expect(style.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  await expect(style.getPropertyValue("--callout-color").trim()).toBe(
    "8, 109, 221",
  );
  await expect(getComputedStyle(title).color).not.toBe(style.color);
}

export const Preview: Story = {
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/callouts/preview-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  play: async ({ canvasElement }) => {
    await expectRenderedCalloutColors(canvasElement);
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
        "/visual-baselines/stories/markdown/callouts/live-preview-chromium.png",
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
        code: markdownEditorDocsSource("calloutsMarkdown", "live-preview"),
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expectRenderedCalloutColors(canvasElement);
  },
};

export const SourceMode: Story = {
  tags: [
    "visual-failed",
    "!visual-pending",
    "!visual-approved",
    "!visual-ready",
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
        "/visual-baselines/stories/markdown/callouts/source-mode-chromium.png",
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
        code: markdownEditorDocsSource("calloutsMarkdown", "source"),
      },
    },
  },
};
