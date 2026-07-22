import type { Meta, StoryObj } from "@storybook/svelte-vite";
import WikilinksLive from "./WikilinksLive.svelte";
import WikilinksPreview from "./WikilinksPreview.svelte";
import WikilinksSource from "./WikilinksSource.svelte";

const meta = {
  title: "Markdown/Wikilinks",
  component: WikilinksPreview,
  parameters: {
    docs: {
      description: {
        component: "Obsidian-style note references stay portable across apps.",
      },
    },
  },
} satisfies Meta<typeof WikilinksPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {};

export const LivePreview: Story = {
  name: "Live Preview",
  render: () => ({
    Component: WikilinksLive,
  }),
};

export const SourceMode: Story = {
  name: "Source Mode",
  render: () => ({
    Component: WikilinksSource,
  }),
};
