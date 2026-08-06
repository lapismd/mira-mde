import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor } from "storybook/test";
import EditorModeStory from "../_shared/EditorModeStory.svelte";
import MarkdownPreviewStory from "../_shared/MarkdownPreviewStory.svelte";
import {
  markdownEditorDocsSource,
  markdownPreviewDocsSource,
} from "../_shared/docs-source";
import { blockquotesMarkdown } from "../fixtures";

const meta = {
  title: "Markdown/Blockquotes",
  component: MarkdownPreviewStory,
  args: {
    value: blockquotesMarkdown,
  },
  parameters: {
    docs: {
      description: {
        component: "Blockquotes preserve quoted prose and nesting.",
      },
      source: {
        language: "html",
        type: "code",
        code: markdownPreviewDocsSource("blockquotesMarkdown"),
      },
    },
  },
} satisfies Meta<typeof MarkdownPreviewStory>;

export default meta;
type Story = StoryObj<typeof meta>;

async function expectThemePrimaryBorder({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}): Promise<void> {
  const border = await waitFor(() => {
    const rendered = canvasElement.querySelector<HTMLElement>("blockquote");
    const source = canvasElement.querySelector<HTMLElement>(
      ".cm-line.cm-blockquote",
    );
    const element = rendered ?? source;
    expect(element).not.toBeNull();
    return {
      color: getComputedStyle(element!, rendered ? undefined : "::before")
        .borderInlineStartColor,
      element: element!,
    };
  });
  const probe = canvasElement.ownerDocument.createElement("span");
  probe.style.color = "var(--interactive-accent)";
  border.element.append(probe);
  const primary = getComputedStyle(probe).color;
  probe.remove();

  expect(border.color).toBe(primary);
}

export const Preview: Story = {
  play: expectThemePrimaryBorder,
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/blockquotes/preview-chromium.png",
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
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
  name: "Live Preview",
  play: expectThemePrimaryBorder,
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
        "/visual-baselines/stories/markdown/blockquotes/live-preview-chromium.png",
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
        code: markdownEditorDocsSource("blockquotesMarkdown", "live-preview"),
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
        "/visual-baselines/stories/markdown/blockquotes/source-mode-chromium.png",
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
        code: markdownEditorDocsSource("blockquotesMarkdown", "source"),
      },
    },
  },
};
