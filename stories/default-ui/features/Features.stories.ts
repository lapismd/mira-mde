import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { MiraFeature } from "@mira-mde/default-ui/svelte";
import DefaultEditorStory from "../_shared/DefaultEditorStory.svelte";
import {
  defaultEditorArgs,
  defaultEditorArgTypes,
  defaultEditorDocsParameters,
} from "../_shared/argTypes";

const meta = {
  title: "Default UI/Features",
  component: DefaultEditorStory,
  args: defaultEditorArgs,
  argTypes: defaultEditorArgTypes,
  parameters: {
    ...defaultEditorDocsParameters,
    docs: {
      ...defaultEditorDocsParameters.docs,
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
  tags: ["visual-pending"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/default-ui/features/defaults-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
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
  tags: ["visual-pending"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/default-ui/features/without-toolbar-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
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
  tags: ["visual-pending"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/default-ui/features/without-widgets-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
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
  tags: ["visual-pending"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/default-ui/features/edit-modes-only-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
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
  tags: ["visual-pending"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/default-ui/features/compact-toolbar-items-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Compact Toolbar",
  args: {
    featureConfigs: {
      [MiraFeature.Toolbar]: {
        items: ["bold", "italic", "heading", "link"],
      },
    },
  },
};
