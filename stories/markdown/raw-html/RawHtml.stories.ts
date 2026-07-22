import type { Meta, StoryObj } from "@storybook/svelte-vite";
import RawHtmlLive from "./RawHtmlLive.svelte";
import RawHtmlPreview from "./RawHtmlPreview.svelte";
import RawHtmlSource from "./RawHtmlSource.svelte";

const meta = {
  title: "Markdown/Raw HTML",
  component: RawHtmlPreview,
  parameters: {
    docs: {
      description: {
        component: "Trusted raw HTML is preserved in preview surfaces.",
      },
    },
  },
} satisfies Meta<typeof RawHtmlPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {};

export const LivePreview: Story = {
  name: "Live Preview",
  render: () => ({
    Component: RawHtmlLive,
  }),
};

export const SourceMode: Story = {
  name: "Source Mode",
  render: () => ({
    Component: RawHtmlSource,
  }),
};
