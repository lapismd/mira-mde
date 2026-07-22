import type { Meta, StoryObj } from "@storybook/svelte-vite";
import TagsLive from "./TagsLive.svelte";
import TagsPreview from "./TagsPreview.svelte";
import TagsSource from "./TagsSource.svelte";

const meta = {
  title: "Markdown/Tags",
  component: TagsPreview,
  parameters: {
    docs: {
      description: {
        component: "Inline and nested tags render as navigable metadata.",
      },
    },
  },
} satisfies Meta<typeof TagsPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {};

export const LivePreview: Story = {
  name: "Live Preview",
  render: () => ({
    Component: TagsLive,
  }),
};

export const SourceMode: Story = {
  name: "Source Mode",
  render: () => ({
    Component: TagsSource,
  }),
};
