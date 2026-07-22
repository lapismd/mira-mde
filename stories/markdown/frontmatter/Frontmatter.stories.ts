import type { Meta, StoryObj } from "@storybook/svelte-vite";
import FrontmatterLive from "./FrontmatterLive.svelte";
import FrontmatterPreview from "./FrontmatterPreview.svelte";
import FrontmatterSource from "./FrontmatterSource.svelte";

const meta = {
  title: "Markdown/Frontmatter",
  component: FrontmatterPreview,
  parameters: {
    docs: {
      description: {
        component:
          "Frontmatter stores document properties before the Markdown body.",
      },
    },
  },
} satisfies Meta<typeof FrontmatterPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {};

export const LivePreview: Story = {
  name: "Live Preview",
  render: () => ({
    Component: FrontmatterLive,
  }),
};

export const SourceMode: Story = {
  name: "Source Mode",
  render: () => ({
    Component: FrontmatterSource,
  }),
};
