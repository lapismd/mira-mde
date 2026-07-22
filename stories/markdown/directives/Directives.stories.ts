import type { Meta, StoryObj } from "@storybook/svelte-vite";
import DirectivesLive from "./DirectivesLive.svelte";
import DirectivesPreview from "./DirectivesPreview.svelte";
import DirectivesSource from "./DirectivesSource.svelte";

const meta = {
  title: "Markdown/Directives",
  component: DirectivesPreview,
  parameters: {
    docs: {
      description: {
        component: "Directive syntax renders as portable custom elements.",
      },
    },
  },
} satisfies Meta<typeof DirectivesPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {};

export const LivePreview: Story = {
  name: "Live Preview",
  render: () => ({
    Component: DirectivesLive,
  }),
};

export const SourceMode: Story = {
  name: "Source Mode",
  render: () => ({
    Component: DirectivesSource,
  }),
};
