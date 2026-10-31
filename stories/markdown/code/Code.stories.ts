import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
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
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
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

const directiveCode = [
  ':::cell{#typescript lang="ts"}',
  "```ts",
  "const answer: number = 42;",
  "```",
  ":::",
  "",
  ':::cell{#query lang="sql"}',
  "```sql",
  "SELECT 73 AS answer;",
  "```",
  ":::",
].join("\n");

async function assertDirectiveHighlighting(canvasElement: HTMLElement) {
  await waitFor(async () => {
    const keywords = [...canvasElement.querySelectorAll(".cm-keyword")].map(
      (node) => node.textContent,
    );
    await expect(keywords).toContain("const");
    await expect(keywords).toContain("SELECT");
    const numbers = [...canvasElement.querySelectorAll(".cm-number")].map(
      (node) => node.textContent,
    );
    await expect(numbers).toContain("42");
    await expect(numbers).toContain("73");
  });
}

export const DirectiveSource: Story = {
  tags: ["visual-pending"],
  render: () => ({
    Component: EditorModeStory,
    props: { value: directiveCode, mode: "source" },
  }),
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/code/directive-source-chromium.png",
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await assertDirectiveHighlighting(canvasElement);
    const editor = canvasElement.querySelector<HTMLElement>(".cm-content")!;
    await userEvent.click(editor);
    await userEvent.keyboard("{Control>}{End}{/Control}{Enter}");
    await assertDirectiveHighlighting(canvasElement);
  },
};

export const DirectiveLivePreview: Story = {
  tags: ["visual-pending"],
  render: () => ({
    Component: EditorModeStory,
    props: { value: directiveCode.split("\n\n")[0]!, mode: "live-preview" },
  }),
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/code/directive-live-preview-chromium.png",
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Edit source" }),
    );
    await waitFor(async () => {
      await expect(
        canvasElement.querySelector(".cm-keyword"),
      ).toHaveTextContent("const");
      await expect(canvasElement.querySelector(".cm-number")).toHaveTextContent(
        "42",
      );
    });
  },
};
