import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { catalogParameters } from "../catalog/catalog.mjs";
import MiraEditorStory from "./_shared/MiraEditorStory.svelte";
import {
  defaultEditorArgs,
  defaultEditorArgTypes,
  defaultEditorDocsParameters,
} from "./_shared/argTypes";

const meta = {
  title: "Mira Editor/MiraEditor",
  component: MiraEditorStory,
  args: defaultEditorArgs,
  argTypes: defaultEditorArgTypes,
  parameters: {
    ...defaultEditorDocsParameters,
    ...catalogParameters("mira-editor"),
    docs: {
      ...defaultEditorDocsParameters.docs,
      description: {
        component:
          "Default Mira editor shell (`MiraEditor`) with toolbar, modes, themes, and feature configuration.",
      },
    },
  },
} satisfies Meta<typeof MiraEditorStory>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Interactive playground — Controls drive the public configuration props. */
export const Playground: Story = {
  tags: [
    "visual-ready",
    "!visual-pending",
    "!visual-approved",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: ["/visual-baselines/stories/mira-editor/playground-chromium.png"],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Playground",
};
