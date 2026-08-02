import type { Meta, StoryObj } from "@storybook/svelte-vite";
import DefaultEditorStory from "../_shared/DefaultEditorStory.svelte";
import {
  defaultEditorArgs,
  defaultEditorArgTypes,
  defaultEditorDocsParameters,
} from "../_shared/argTypes";

const meta = {
  title: "Default UI/Configuration",
  component: DefaultEditorStory,
  args: defaultEditorArgs,
  argTypes: defaultEditorArgTypes,
  parameters: {
    ...defaultEditorDocsParameters,
    docs: {
      ...defaultEditorDocsParameters.docs,
      description: {
        component:
          "Common MiraDefaultMde configuration props: readonly, indentation, wrapping, outline, emoji, frontmatter, and HTML policy.",
      },
    },
  },
} satisfies Meta<typeof DefaultEditorStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaults: Story = {
  tags: ["visual-pending"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/default-ui/configuration/defaults-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Defaults",
};

export const ReadonlyEditor: Story = {
  tags: ["visual-pending"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/default-ui/configuration/readonly-editor-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Readonly",
  args: { readonly: true },
};

export const IndentationSettings: Story = {
  tags: ["visual-pending"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/default-ui/configuration/indentation-settings-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Indentation",
  args: {
    indentGuides: true,
    indentWithTabs: true,
    indentWidth: 4,
    lineWrapping: false,
  },
};

export const ReadingOptionsSettings: Story = {
  tags: ["visual-pending"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/default-ui/configuration/reading-options-settings-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Reading Options",
  args: {
    outline: true,
    emoji: true,
    frontmatterOpen: false,
    htmlPolicy: "safe",
  },
};
