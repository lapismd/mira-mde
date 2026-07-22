import type { Meta, StoryObj } from "@storybook/svelte-vite";
import MermaidLive from "./MermaidLive.svelte";
import MermaidPreview from "./MermaidPreview.svelte";
import MermaidSource from "./MermaidSource.svelte";

const meta = {
  title: "Markdown/Mermaid",
  component: MermaidPreview,
  parameters: {
    docs: {
      description: {
        component:
          "Mermaid diagrams render inline with Lapis-compatible controls.",
      },
    },
  },
} satisfies Meta<typeof MermaidPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {};

export const LivePreview: Story = {
  name: "Live Preview",
  render: () => ({
    Component: MermaidLive,
  }),
};

export const SourceMode: Story = {
  name: "Source Mode",
  render: () => ({
    Component: MermaidSource,
  }),
};
