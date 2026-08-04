import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { catalogParameters } from "../../catalog/catalog.mjs";
import EditorModeStory from "../_shared/EditorModeStory.svelte";
import MarkdownPreviewStory from "../_shared/MarkdownPreviewStory.svelte";
import {
  markdownEditorDocsSource,
  markdownPreviewDocsSource,
} from "../_shared/docs-source";
import { mermaidMarkdownFeature } from "../fixtures";
import MermaidDialogStory from "./MermaidDialogStory.svelte";

const meta = {
  title: "Markdown/Mermaid",
  component: MarkdownPreviewStory,
  args: {
    value: mermaidMarkdownFeature,
  },
  parameters: {
    ...catalogParameters("mermaid"),
    docs: {
      description: {
        component:
          "Mermaid diagrams render inline with Lapis-compatible controls.",
      },
      source: {
        language: "html",
        type: "code",
        code: markdownPreviewDocsSource("mermaidMarkdownFeature"),
      },
    },
  },
} satisfies Meta<typeof MarkdownPreviewStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {
  tags: ["visual-ready"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/mermaid/preview-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvasElement.querySelector(".mermaid svg")).toBeTruthy();
    });
    await userEvent.click(
      canvas.getByRole("button", { name: "Expand Mermaid diagram" }),
    );
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      body.getByRole("dialog", { name: "Mermaid diagram" }),
    ).toBeVisible();
  },
};

export const LivePreview: Story = {
  tags: ["visual-ready"],
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
        "/visual-baselines/stories/markdown/mermaid/live-preview-chromium.png",
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
        code: markdownEditorDocsSource(
          "mermaidMarkdownFeature",
          "live-preview",
        ),
      },
    },
  },
};

export const SourceMode: Story = {
  tags: ["visual-ready"],
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
        "/visual-baselines/stories/markdown/mermaid/source-mode-chromium.png",
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
        code: markdownEditorDocsSource("mermaidMarkdownFeature", "source"),
      },
    },
  },
};

export const DialogControls: Story = {
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/mermaid/dialog-controls-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Dialog controls",
  render: () => ({
    Component: MermaidDialogStory,
  }),
  tags: ["visual-ready"],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvasElement.querySelector(".mermaid svg")).toBeTruthy();
    });

    await step("exercise expanded-view controls", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Zoom in" }));
      await userEvent.click(canvas.getByRole("button", { name: "Pan right" }));
      await userEvent.click(canvas.getByRole("button", { name: "Reset view" }));
    });
  },
};
