import type { Meta, StoryObj } from "@storybook/svelte-vite";
import HeadingsLive from "./HeadingsLive.svelte";
import HeadingsPreview from "./HeadingsPreview.svelte";
import HeadingsSource from "./HeadingsSource.svelte";

const meta = {
  title: "Markdown/Headings",
  component: HeadingsPreview,
  parameters: {
    docs: {
      description: {
        component:
          "Headings create the document outline used by reading and editor surfaces.",
      },
    },
  },
} satisfies Meta<typeof HeadingsPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {};

export const LivePreview: Story = {
  name: "Live Preview",
  render: () => ({
    Component: HeadingsLive,
  }),
};

export const SourceMode: Story = {
  name: "Source Mode",
  render: () => ({
    Component: HeadingsSource,
  }),
};
