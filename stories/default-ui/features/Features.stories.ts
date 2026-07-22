import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { MiraFeature } from "@mira-mde/default-ui/svelte";
import DefaultEditorStory from "../_shared/DefaultEditorStory.svelte";
import { defaultEditorArgs, defaultEditorArgTypes } from "../_shared/argTypes";

const meta = {
  title: "Default UI/Features",
  component: DefaultEditorStory,
  args: defaultEditorArgs,
  argTypes: defaultEditorArgTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Feature flags and featureConfigs control toolbar items, mode availability, Mermaid/tables, and slash commands.",
      },
    },
  },
} satisfies Meta<typeof DefaultEditorStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaults: Story = {
  name: "Defaults",
  args: {
    features: {
      [MiraFeature.Toolbar]: true,
      [MiraFeature.ModeSwitch]: true,
      [MiraFeature.Mermaid]: true,
      [MiraFeature.Tables]: true,
      [MiraFeature.GridTables]: true,
      [MiraFeature.SlashCommands]: true,
    },
  },
};

export const WithoutToolbar: Story = {
  name: "Without Toolbar",
  args: {
    mode: "live-preview",
    features: {
      [MiraFeature.Toolbar]: false,
      [MiraFeature.ModeSwitch]: false,
    },
  },
};

export const WithoutWidgets: Story = {
  name: "Without Widgets",
  args: {
    mode: "live-preview",
    features: {
      [MiraFeature.Mermaid]: false,
      [MiraFeature.Tables]: false,
      [MiraFeature.GridTables]: false,
      [MiraFeature.Math]: false,
      [MiraFeature.SlashCommands]: false,
    },
  },
};

export const EditModesOnly: Story = {
  name: "Edit Modes Only",
  args: {
    mode: "live-preview",
    features: {
      [MiraFeature.SourceMode]: true,
      [MiraFeature.LivePreviewMode]: true,
      [MiraFeature.PreviewMode]: false,
      [MiraFeature.SplitMode]: false,
    },
  },
};

export const CompactToolbarItems: Story = {
  name: "Compact Toolbar",
  args: {
    featureConfigs: {
      [MiraFeature.Toolbar]: {
        items: ["bold", "italic", "heading", "link"],
      },
    },
  },
};
