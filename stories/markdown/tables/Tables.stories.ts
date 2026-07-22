import type { Meta, StoryObj } from "@storybook/svelte-vite";
import TablesLive from "./TablesLive.svelte";
import TablesPreview from "./TablesPreview.svelte";
import TablesSource from "./TablesSource.svelte";

const meta = {
  title: "Markdown/Tables",
  component: TablesPreview,
  parameters: {
    docs: {
      description: {
        component:
          "Pipe tables support alignment markers and shared preview styling.",
      },
    },
  },
} satisfies Meta<typeof TablesPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {};

export const LivePreview: Story = {
  name: "Live Preview",
  render: () => ({
    Component: TablesLive,
  }),
};

export const SourceMode: Story = {
  name: "Source Mode",
  render: () => ({
    Component: TablesSource,
  }),
};
