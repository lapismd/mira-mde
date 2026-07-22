import type { Meta, StoryObj } from "@storybook/svelte-vite";
import DefaultEditorStory from "./_shared/DefaultEditorStory.svelte";
import {
  defaultEditorArgs,
  defaultEditorArgTypes,
  defaultEditorDocsParameters,
} from "./_shared/argTypes";

const meta = {
  title: "Default UI/MiraDefaultMde",
  component: DefaultEditorStory,
  args: defaultEditorArgs,
  argTypes: defaultEditorArgTypes,
  parameters: {
    ...defaultEditorDocsParameters,
    docs: {
      ...defaultEditorDocsParameters.docs,
      description: {
        component:
          "Default Mira editor shell (`MiraDefaultMde`) with toolbar, modes, themes, and feature configuration.",
      },
    },
  },
} satisfies Meta<typeof DefaultEditorStory>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Interactive playground — Controls drive the public configuration props. */
export const Playground: Story = {
  name: "Playground",
};
