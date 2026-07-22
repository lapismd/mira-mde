import type { Meta, StoryObj } from "@storybook/svelte-vite";
import ListsLive from "./ListsLive.svelte";
import ListsPreview from "./ListsPreview.svelte";
import ListsSource from "./ListsSource.svelte";

const meta = {
  title: "Markdown/Lists",
  component: ListsPreview,
  parameters: {
    docs: {
      description: {
        component:
          "Ordered and unordered lists keep nested alignment and wrapping.",
      },
    },
  },
} satisfies Meta<typeof ListsPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {};

export const LivePreview: Story = {
  name: "Live Preview",
  render: () => ({
    Component: ListsLive,
  }),
};

export const SourceMode: Story = {
  name: "Source Mode",
  render: () => ({
    Component: ListsSource,
  }),
};
