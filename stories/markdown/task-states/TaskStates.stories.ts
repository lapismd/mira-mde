import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import EditorModeStory from "../_shared/EditorModeStory.svelte";
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
  tags: ["visual-pending"],
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
};

export const LivePreview: Story = {
  tags: ["visual-pending"],
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
  tags: ["visual-pending"],
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
