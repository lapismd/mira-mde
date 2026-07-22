import type { Meta, StoryObj } from "@storybook/svelte-vite";
import CalloutsLive from "./CalloutsLive.svelte";
import CalloutsPreview from "./CalloutsPreview.svelte";
import CalloutsSource from "./CalloutsSource.svelte";

const meta = {
  title: "Markdown/Callouts",
  component: CalloutsPreview,
  parameters: {
    docs: {
      description: {
        component:
          "Obsidian-style callouts with labels, icons, and collapsible state.",
      },
    },
  },
} satisfies Meta<typeof CalloutsPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {};

export const LivePreview: Story = {
  name: "Live Preview",
  render: () => ({
    Component: CalloutsLive,
  }),
};

export const SourceMode: Story = {
  name: "Source Mode",
  render: () => ({
    Component: CalloutsSource,
  }),
};
