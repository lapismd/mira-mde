import type { Meta, StoryObj } from "@storybook/svelte-vite";
import MiraEditorStory from "../_shared/MiraEditorStory.svelte";
import {
  defaultEditorArgs,
  defaultEditorArgTypes,
  defaultEditorDocsParameters,
} from "../_shared/argTypes";

const meta = {
  title: "Mira Editor/Modes",
  component: MiraEditorStory,
  args: defaultEditorArgs,
  argTypes: defaultEditorArgTypes,
  parameters: {
    ...defaultEditorDocsParameters,
    docs: {
      ...defaultEditorDocsParameters.docs,
      description: {
        component:
          "MiraEditor supports source, live-preview, preview, and split modes.",
      },
    },
  },
} satisfies Meta<typeof MiraEditorStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LivePreview: Story = {
  tags: [
    "visual-ready",
    "!visual-pending",
    "!visual-approved",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/mira-editor/modes/live-preview-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Live Preview",
  args: { mode: "live-preview" },
};

export const Source: Story = {
  tags: [
    "visual-ready",
    "!visual-pending",
    "!visual-approved",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/mira-editor/modes/source-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Source",
  args: { mode: "source" },
};

export const Preview: Story = {
  tags: [
    "visual-ready",
    "!visual-pending",
    "!visual-approved",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/mira-editor/modes/preview-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Preview",
  args: { mode: "preview" },
};

export const Split: Story = {
  tags: [
    "visual-ready",
    "!visual-pending",
    "!visual-approved",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/mira-editor/modes/split-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Split",
  args: { mode: "split", height: "40rem" },
};
