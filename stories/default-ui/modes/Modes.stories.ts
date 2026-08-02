import type { Meta, StoryObj } from "@storybook/svelte-vite";
import DefaultEditorStory from "../_shared/DefaultEditorStory.svelte";
import {
  defaultEditorArgs,
  defaultEditorArgTypes,
  defaultEditorDocsParameters,
} from "../_shared/argTypes";

const meta = {
  title: "Default UI/Modes",
  component: DefaultEditorStory,
  args: defaultEditorArgs,
  argTypes: defaultEditorArgTypes,
  parameters: {
    ...defaultEditorDocsParameters,
    docs: {
      ...defaultEditorDocsParameters.docs,
      description: {
        component:
          "MiraDefaultMde supports source, live-preview, preview, and split modes.",
      },
    },
  },
} satisfies Meta<typeof DefaultEditorStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LivePreview: Story = {
  tags: ["visual-pending"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/default-ui/modes/live-preview-chromium.png",
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
  tags: ["visual-pending"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/default-ui/modes/source-chromium.png",
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
  tags: ["visual-pending"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/default-ui/modes/preview-chromium.png",
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
  tags: ["visual-pending"],
  parameters: {
    visualDelta: {
      images: ["/visual-baselines/stories/default-ui/modes/split-chromium.png"],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Split",
  args: { mode: "split", height: "40rem" },
};
