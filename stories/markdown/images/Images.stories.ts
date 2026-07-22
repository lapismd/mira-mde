import type { Meta, StoryObj } from "@storybook/svelte-vite";
import ImagesLive from "./ImagesLive.svelte";
import ImagesPreview from "./ImagesPreview.svelte";
import ImagesSource from "./ImagesSource.svelte";

const meta = {
  title: "Markdown/Images",
  component: ImagesPreview,
  parameters: {
    docs: {
      description: {
        component: "Images resolve through the configured asset resolver.",
      },
    },
  },
} satisfies Meta<typeof ImagesPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {};

export const LivePreview: Story = {
  name: "Live Preview",
  render: () => ({
    Component: ImagesLive,
  }),
};

export const SourceMode: Story = {
  name: "Source Mode",
  render: () => ({
    Component: ImagesSource,
  }),
};
