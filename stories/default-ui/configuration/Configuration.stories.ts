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
  name: "Defaults",
};

export const ReadonlyEditor: Story = {
  name: "Readonly",
  args: { readonly: true },
};

export const IndentationSettings: Story = {
  name: "Indentation",
  args: {
    indentGuides: true,
    indentWithTabs: true,
    indentWidth: 4,
    lineWrapping: false,
  },
};

export const ReadingOptionsSettings: Story = {
  name: "Reading Options",
  args: {
    outline: true,
    emoji: true,
    frontmatterOpen: false,
    htmlPolicy: "safe",
  },
};
