import type { Meta, StoryObj } from "@storybook/svelte-vite";
import InlineFormattingLive from "./InlineFormattingLive.svelte";
import InlineFormattingPreview from "./InlineFormattingPreview.svelte";
import InlineFormattingSource from "./InlineFormattingSource.svelte";

const meta = {
  title: "Markdown/Inline Formatting",
  component: InlineFormattingPreview,
  parameters: {
    docs: {
      description: {
        component:
          "Bold, italic, strikethrough, and inline code compose inside paragraphs.",
      },
    },
  },
} satisfies Meta<typeof InlineFormattingPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {};

export const LivePreview: Story = {
  name: "Live Preview",
  render: () => ({
    Component: InlineFormattingLive,
  }),
};

export const SourceMode: Story = {
  name: "Source Mode",
  render: () => ({
    Component: InlineFormattingSource,
  }),
};
