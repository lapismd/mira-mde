import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import EditorModeStory from "../_shared/EditorModeStory.svelte";
import MarkdownPreviewStory from "../_shared/MarkdownPreviewStory.svelte";
import {
  markdownEditorDocsSource,
  markdownPreviewDocsSource,
} from "../_shared/docs-source";
import { codeMarkdown } from "../fixtures";

const meta = {
  title: "Markdown/Code",
  component: MarkdownPreviewStory,
  args: {
    value: codeMarkdown,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Inline code and fenced blocks with optional line highlights.",
      },
      source: {
        language: "html",
        type: "code",
        code: markdownPreviewDocsSource("codeMarkdown"),
      },
    },
  },
} satisfies Meta<typeof MarkdownPreviewStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {
  tags: ["visual-approved", "!visual-pending", "!visual-ready", "!visual-failed"],
  parameters: {
    visualDelta: {
      images: ["/visual-baselines/stories/markdown/code/preview-chromium.png"],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const writeText = fn(async (_value: string) => undefined);
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: writeText,
    });
    const copy = canvas.getAllByRole("button", { name: "Copy code" })[0];
    copy.focus();
    await userEvent.keyboard("{Enter}");
    await expect(writeText).toHaveBeenCalledOnce();
    await expect(
      canvas.getAllByRole("button", { name: "Copied" })[0],
    ).toHaveAttribute("title", "Copied");
  },
};

export const LivePreview: Story = {
  tags: ["visual-approved", "!visual-pending", "!visual-ready", "!visual-failed"],
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
        "/visual-baselines/stories/markdown/code/live-preview-chromium.png",
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
        code: markdownEditorDocsSource("codeMarkdown", "live-preview"),
      },
    },
  },
};

export const SourceMode: Story = {
  tags: ["visual-approved", "!visual-pending", "!visual-ready", "!visual-failed"],
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
        "/visual-baselines/stories/markdown/code/source-mode-chromium.png",
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
        code: markdownEditorDocsSource("codeMarkdown", "source"),
      },
    },
  },
};
