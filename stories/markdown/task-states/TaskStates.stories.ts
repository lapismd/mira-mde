import type { Meta, StoryObj } from "@storybook/svelte-vite";
import TaskStatesLive from "./TaskStatesLive.svelte";
import TaskStatesPreview from "./TaskStatesPreview.svelte";
import TaskStatesSource from "./TaskStatesSource.svelte";

const meta = {
  title: "Markdown/Task States",
  component: TaskStatesPreview,
  parameters: {
    docs: {
      description: {
        component:
          "Custom checklist markers cover draft, done, in-progress, and more.",
      },
    },
  },
} satisfies Meta<typeof TaskStatesPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {};

export const LivePreview: Story = {
  name: "Live Preview",
  render: () => ({
    Component: TaskStatesLive,
  }),
};

export const SourceMode: Story = {
  name: "Source Mode",
  render: () => ({
    Component: TaskStatesSource,
  }),
};
