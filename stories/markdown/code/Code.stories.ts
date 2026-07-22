import type { Meta, StoryObj } from "@storybook/svelte-vite";
import CodeLive from "./CodeLive.svelte";
import CodePreview from "./CodePreview.svelte";
import CodeSource from "./CodeSource.svelte";

const meta = {
  title: "Markdown/Code",
  component: CodePreview,
  parameters: {
    docs: {
      description: {
        component:
          "Inline code and fenced blocks with optional line highlights.",
      },
    },
  },
} satisfies Meta<typeof CodePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {};

export const LivePreview: Story = {
  name: "Live Preview",
  render: () => ({
    Component: CodeLive,
  }),
};

export const SourceMode: Story = {
  name: "Source Mode",
  render: () => ({
    Component: CodeSource,
  }),
};
