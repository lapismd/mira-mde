import type { Meta, StoryObj } from "@storybook/svelte-vite";
import BlockquotesLive from "./BlockquotesLive.svelte";
import BlockquotesPreview from "./BlockquotesPreview.svelte";
import BlockquotesSource from "./BlockquotesSource.svelte";

const meta = {
  title: "Markdown/Blockquotes",
  component: BlockquotesPreview,
  parameters: {
    docs: {
      description: {
        component: "Blockquotes preserve quoted prose and nesting.",
      },
    },
  },
} satisfies Meta<typeof BlockquotesPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {};

export const LivePreview: Story = {
  name: "Live Preview",
  render: () => ({
    Component: BlockquotesLive,
  }),
};

export const SourceMode: Story = {
  name: "Source Mode",
  render: () => ({
    Component: BlockquotesSource,
  }),
};
