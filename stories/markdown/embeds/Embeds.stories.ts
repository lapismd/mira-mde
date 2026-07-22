import type { Meta, StoryObj } from "@storybook/svelte-vite";
import EmbedsLive from "./EmbedsLive.svelte";
import EmbedsPreview from "./EmbedsPreview.svelte";
import EmbedsSource from "./EmbedsSource.svelte";

const meta = {
  title: "Markdown/Embeds",
  component: EmbedsPreview,
  parameters: {
    docs: {
      description: {
        component:
          "Embed another note or asset with Obsidian-style embed syntax.",
      },
    },
  },
} satisfies Meta<typeof EmbedsPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {};

export const LivePreview: Story = {
  name: "Live Preview",
  render: () => ({
    Component: EmbedsLive,
  }),
};

export const SourceMode: Story = {
  name: "Source Mode",
  render: () => ({
    Component: EmbedsSource,
  }),
};
