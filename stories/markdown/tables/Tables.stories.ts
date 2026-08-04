import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import { catalogParameters } from "../../catalog/catalog.mjs";
import EditorModeStory from "../_shared/EditorModeStory.svelte";
import MarkdownPreviewStory from "../_shared/MarkdownPreviewStory.svelte";
import {
  markdownEditorDocsSource,
  markdownPreviewDocsSource,
} from "../_shared/docs-source";
import { tablesMarkdown } from "../fixtures";

const meta = {
  title: "Markdown/Tables",
  component: MarkdownPreviewStory,
  args: {
    value: tablesMarkdown,
  },
  parameters: {
    ...catalogParameters("tables"),
    docs: {
      description: {
        component:
          "Pipe tables support alignment markers and shared preview styling.",
      },
      source: {
        language: "html",
        type: "code",
        code: markdownPreviewDocsSource("tablesMarkdown"),
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
        "/visual-baselines/stories/markdown/tables/preview-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
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
        "/visual-baselines/stories/markdown/tables/live-preview-chromium.png",
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
        code: markdownEditorDocsSource("tablesMarkdown", "live-preview"),
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sourceToggle = await canvas.findByRole("button", {
      name: "Edit table source",
    });
    await userEvent.click(sourceToggle);
    await expect(
      canvas.queryByRole("button", { name: "Edit table source" }),
    ).not.toBeInTheDocument();
    const editor = canvasElement.querySelector<HTMLElement>(".cm-content");
    await expect(editor).toHaveTextContent("Package");
    await expect(editor).toHaveTextContent("Surface");
    await expect(editor).toHaveTextContent("Status");
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
        "/visual-baselines/stories/markdown/tables/source-mode-chromium.png",
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
        code: markdownEditorDocsSource("tablesMarkdown", "source"),
      },
    },
  },
};
