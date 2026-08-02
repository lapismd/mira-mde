import type { Meta, StoryObj } from "@storybook/svelte-vite";
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

export const Preview: Story = {};

export const LivePreview: Story = {
  name: "Live Preview",
  render: (args) => ({
    Component: EditorModeStory,
    props: {
      ...args,
      mode: "live-preview",
    },
  }),
  parameters: {
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
  name: "Source Mode",
  render: (args) => ({
    Component: EditorModeStory,
    props: {
      ...args,
      mode: "source",
    },
  }),
  parameters: {
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
  name: "Dialog controls",
  render: () => ({
    Component: MermaidDialogStory,
  }),
  tags: ["visual-pending"],
};
