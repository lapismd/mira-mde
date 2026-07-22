import type { Meta, StoryObj } from "@storybook/svelte-vite";
import LinksLive from "./LinksLive.svelte";
import LinksPreview from "./LinksPreview.svelte";
import LinksSource from "./LinksSource.svelte";

const meta = {
  title: "Markdown/Links",
  component: LinksPreview,
  parameters: {
    docs: {
      description: {
        component:
          "Relative, external, and automatic links resolve through the configured adapter.",
      },
    },
  },
} satisfies Meta<typeof LinksPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {};

export const LivePreview: Story = {
  name: "Live Preview",
  render: () => ({
    Component: LinksLive,
  }),
};

export const SourceMode: Story = {
  name: "Source Mode",
  render: () => ({
    Component: LinksSource,
  }),
};
