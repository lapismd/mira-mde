import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import EditorModeStory from "../_shared/EditorModeStory.svelte";
import EmbeddedTaskEditorStory from "./EmbeddedTaskEditorStory.svelte";
import MarkdownPreviewStory from "../_shared/MarkdownPreviewStory.svelte";
import {
  markdownEditorDocsSource,
  markdownPreviewDocsSource,
} from "../_shared/docs-source";
import { taskStatesMarkdown } from "../fixtures";

const meta = {
  title: "Markdown/Task States",
  component: MarkdownPreviewStory,
  args: {
    value: taskStatesMarkdown,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Custom checklist markers cover draft, done, in-progress, and more.",
      },
      source: {
        language: "html",
        type: "code",
        code: markdownPreviewDocsSource("taskStatesMarkdown"),
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
      images: [
        "/visual-baselines/stories/markdown/task-states/preview-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  play: async ({ canvasElement }) => {
    const question = canvasElement.querySelector<HTMLElement>(
      'input[type="checkbox"][data-task="?"]',
    );
    const important = canvasElement.querySelector<HTMLElement>(
      'input[type="checkbox"][data-task="!"]',
    );
    if (!question || !important)
      throw new Error("Custom task-state controls did not render");

    await expect(getComputedStyle(question).backgroundColor).toBe(
      "rgb(213, 138, 0)",
    );
    await expect(getComputedStyle(important).color).toBe("rgb(213, 138, 0)");
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
        "/visual-baselines/stories/markdown/task-states/live-preview-chromium.png",
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
        code: markdownEditorDocsSource("taskStatesMarkdown", "live-preview"),
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getAllByRole("checkbox", {
      name: "Toggle task",
    })[0];
    await expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();
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
        "/visual-baselines/stories/markdown/task-states/source-mode-chromium.png",
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
        code: markdownEditorDocsSource("taskStatesMarkdown", "source"),
      },
    },
  },
};

export const EmbeddedLivePreview: Story = {
  tags: ["visual-pending"],
  render: () => ({ Component: EmbeddedTaskEditorStory }),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const lines =
        canvasElement.querySelectorAll<HTMLElement>(".cm-task-line");
      expect(lines).toHaveLength(2);
      for (const line of lines) {
        const checkbox = line.querySelector<HTMLInputElement>(
          "input[type=checkbox]",
        )!;
        const label = line.querySelector<HTMLElement>(".cm-list-1")!;
        const checkboxRect = checkbox.getBoundingClientRect();
        const labelRect = label.getClientRects()[0];
        expect(labelRect.top).toBeLessThan(checkboxRect.bottom);
        expect(labelRect.bottom).toBeGreaterThan(checkboxRect.top);
        expect(labelRect.left).toBeGreaterThanOrEqual(checkboxRect.right);
        const buffers = line.querySelectorAll<HTMLImageElement>(
          "img.cm-widgetBuffer",
        );
        expect(buffers.length).toBeGreaterThan(0);
        for (const buffer of buffers) {
          expect(getComputedStyle(buffer).display).toBe("inline");
          expect(buffer.getBoundingClientRect().width).toBe(0);
          expect(getComputedStyle(buffer).borderTopWidth).toBe("0px");
        }
      }
    });
    const image = within(canvasElement).getByRole("img", {
      name: "Gray square",
    });
    expect(getComputedStyle(image).display).toBe("block");
    expect(getComputedStyle(image).borderTopWidth).toBe("1px");
    const checkbox = within(canvasElement).getAllByRole("checkbox", {
      name: "Toggle task",
    })[0];
    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();
  },
};
