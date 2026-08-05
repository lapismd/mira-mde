import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import MarkdownToolbarActionsStory from "./MarkdownToolbarActionsStory.svelte";

const meta = {
  title: "Mira Editor/Features/Markdown Toolbar Actions",
  component: MarkdownToolbarActionsStory,
  tags: ["skip-visual"],
  args: {
    value: "Toolbar action target",
    mode: "source",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Deterministic public-handle acceptance for context-aware Markdown toolbar toggles in source and live preview modes.",
      },
    },
  },
} satisfies Meta<typeof MarkdownToolbarActionsStory>;

export default meta;
type Story = StoryObj<typeof meta>;

type Position = { line: number; ch: number };

function harnessRoot(canvasElement: HTMLElement): HTMLElement {
  const root = canvasElement.querySelector<HTMLElement>(
    "[data-markdown-toolbar-actions]",
  );
  if (!root) throw new Error("Markdown toolbar action harness did not render");
  return root;
}

async function setupAction(
  canvasElement: HTMLElement,
  markdown: string,
  anchor: Position,
  head: Position = anchor,
): Promise<void> {
  const root = harnessRoot(canvasElement);
  root.dispatchEvent(
    new CustomEvent("mira-story-setup-markdown-action", {
      detail: { markdown, selection: { anchor, head } },
    }),
  );
  await waitFor(() =>
    expect(root).toHaveAttribute("data-markdown-value", markdown),
  );
}

async function expectMarkdown(
  canvasElement: HTMLElement,
  markdown: string,
): Promise<void> {
  await waitFor(() =>
    expect(harnessRoot(canvasElement)).toHaveAttribute(
      "data-markdown-value",
      markdown,
    ),
  );
}

async function expectToggle({
  canvasElement,
  label,
  source,
  first,
  repeated,
  anchor,
  head,
}: {
  canvasElement: HTMLElement;
  label: string;
  source: string;
  first: string;
  repeated: string;
  anchor: Position;
  head?: Position;
}): Promise<void> {
  const canvas = within(canvasElement);
  await setupAction(canvasElement, source, anchor, head);
  const button = canvas.getByRole("button", { name: label });
  await expect(button).toBeEnabled();
  await userEvent.click(button);
  await expectMarkdown(canvasElement, first);
  await userEvent.click(button);
  await expectMarkdown(canvasElement, repeated);
}

async function runToolbarActionAcceptance({
  canvasElement,
  step,
}: {
  canvasElement: HTMLElement;
  step: (name: string, run: () => Promise<void>) => Promise<void>;
}): Promise<void> {
  await step("toggle an H1 at the containing line", async () => {
    await expectToggle({
      canvasElement,
      label: "Heading",
      source: "Paragraph",
      first: "# Paragraph",
      repeated: "Paragraph",
      anchor: { line: 0, ch: 4 },
    });
  });

  await step(
    "toggle every inline formatting action at the current word",
    async () => {
      for (const [label, first] of [
        ["Bold", "Plain **word** text"],
        ["Italic", "Plain _word_ text"],
        ["Strikethrough", "Plain ~~word~~ text"],
        ["Inline code", "Plain `word` text"],
      ] as const) {
        await expectToggle({
          canvasElement,
          label,
          source: "Plain word text",
          first,
          repeated: "Plain word text",
          anchor: { line: 0, ch: 8 },
        });
      }
    },
  );

  await step("wrap and unlink the current word", async () => {
    await expectToggle({
      canvasElement,
      label: "Link",
      source: "Visit Mira now",
      first: "Visit [Mira](https://example.com) now",
      repeated: "Visit Mira now",
      anchor: { line: 0, ch: 8 },
    });
  });

  await step("normalize and remove a selected blockquote", async () => {
    await expectToggle({
      canvasElement,
      label: "Blockquote",
      source: "One\nTwo",
      first: "> One\n> Two",
      repeated: "One\nTwo",
      anchor: { line: 0, ch: 0 },
      head: { line: 1, ch: 3 },
    });
  });

  await step("normalize and remove every list type", async () => {
    await expectToggle({
      canvasElement,
      label: "Bullet list",
      source: "One\n2. Two",
      first: "- One\n- Two",
      repeated: "One\nTwo",
      anchor: { line: 0, ch: 0 },
      head: { line: 1, ch: 6 },
    });
    await expectToggle({
      canvasElement,
      label: "Numbered list",
      source: "- One\nTwo",
      first: "1. One\n1. Two",
      repeated: "One\nTwo",
      anchor: { line: 0, ch: 0 },
      head: { line: 1, ch: 3 },
    });
    await expectToggle({
      canvasElement,
      label: "Task list",
      source: "One\n* [x] Done",
      first: "- [ ] One\n* [x] Done",
      repeated: "One\nDone",
      anchor: { line: 0, ch: 0 },
      head: { line: 1, ch: 10 },
    });
  });
}

export const Source: Story = {
  name: "Source",
  play: runToolbarActionAcceptance,
};

export const LivePreview: Story = {
  name: "Live Preview",
  args: { mode: "live-preview" },
  play: runToolbarActionAcceptance,
};
