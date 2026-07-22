import type { Meta, StoryObj } from "@storybook/svelte-vite";
import GridTablesLive from "./GridTablesLive.svelte";
import GridTablesPreview from "./GridTablesPreview.svelte";
import GridTablesSource from "./GridTablesSource.svelte";

const meta = {
  title: "Markdown/Grid Tables",
  component: GridTablesPreview,
  parameters: {
    docs: {
      description: {
        component:
          "Grid tables use explicit boundaries for spans, sections, and alignment.",
      },
    },
  },
} satisfies Meta<typeof GridTablesPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {};

export const LivePreview: Story = {
  name: "Live Preview",
  render: () => ({
    Component: GridTablesLive,
  }),
};

export const SourceMode: Story = {
  name: "Source Mode",
  render: () => ({
    Component: GridTablesSource,
  }),
};
