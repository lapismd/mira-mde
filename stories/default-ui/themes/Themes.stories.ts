import type { Meta, StoryObj } from "@storybook/svelte-vite";
import DefaultEditorStory from "../_shared/DefaultEditorStory.svelte";
import {
  defaultEditorArgs,
  defaultEditorArgTypes,
  defaultEditorDocsParameters,
} from "../_shared/argTypes";

const meta = {
  title: "Default UI/Themes",
  component: DefaultEditorStory,
  args: defaultEditorArgs,
  argTypes: defaultEditorArgTypes,
  parameters: {
    ...defaultEditorDocsParameters,
    docs: {
      ...defaultEditorDocsParameters.docs,
      description: {
        component:
          "Theme tokens for MiraDefaultMde via the theme prop (light, dark, obsidian, system, inherit).",
      },
    },
  },
} satisfies Meta<typeof DefaultEditorStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {
  tags: ["visual-pending"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/default-ui/themes/light-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  args: { theme: "light" },
};

export const Dark: Story = {
  tags: ["visual-pending"],
  parameters: {
    visualDelta: {
      images: ["/visual-baselines/stories/default-ui/themes/dark-chromium.png"],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  args: { theme: "dark" },
};

export const Obsidian: Story = {
  tags: ["visual-pending"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/default-ui/themes/obsidian-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  args: { theme: "obsidian" },
};
