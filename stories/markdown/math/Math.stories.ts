import type { Meta, StoryObj } from "@storybook/svelte-vite";
import MathLive from "./MathLive.svelte";
import MathPreview from "./MathPreview.svelte";
import MathSource from "./MathSource.svelte";

const meta = {
  title: "Markdown/Math",
  component: MathPreview,
  parameters: {
    docs: {
      description: {
        component: "Inline and block KaTeX math rendering.",
      },
    },
  },
} satisfies Meta<typeof MathPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {};

export const LivePreview: Story = {
  name: "Live Preview",
  render: () => ({
    Component: MathLive,
  }),
};

export const SourceMode: Story = {
  name: "Source Mode",
  render: () => ({
    Component: MathSource,
  }),
};
