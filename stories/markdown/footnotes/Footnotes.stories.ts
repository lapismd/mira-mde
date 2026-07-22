import type { Meta, StoryObj } from "@storybook/svelte-vite";
import FootnotesLive from "./FootnotesLive.svelte";
import FootnotesPreview from "./FootnotesPreview.svelte";
import FootnotesSource from "./FootnotesSource.svelte";

const meta = {
  title: "Markdown/Footnotes",
  component: FootnotesPreview,
  parameters: {
    docs: {
      description: {
        component:
          "Footnotes keep supporting details next to related paragraphs.",
      },
    },
  },
} satisfies Meta<typeof FootnotesPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {};

export const LivePreview: Story = {
  name: "Live Preview",
  render: () => ({
    Component: FootnotesLive,
  }),
};

export const SourceMode: Story = {
  name: "Source Mode",
  render: () => ({
    Component: FootnotesSource,
  }),
};
