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
  name: "Live Preview",
  args: { mode: "live-preview" },
};

export const Source: Story = {
  name: "Source",
  args: { mode: "source" },
};

export const Preview: Story = {
  name: "Preview",
  args: { mode: "preview" },
};

export const Split: Story = {
  name: "Split",
  args: { mode: "split", height: "40rem" },
};
