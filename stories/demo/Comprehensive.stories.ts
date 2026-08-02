import type { Meta, StoryObj } from "@storybook/svelte-vite";
import ComprehensiveDemoStory from "./ComprehensiveDemoStory.svelte";
import comprehensiveMarkdown from "./comprehensive-demo.md?raw";

const meta = {
  title: "Demo/Comprehensive",
  component: ComprehensiveDemoStory,
  tags: ["visual-pending"],
  args: {
    value: comprehensiveMarkdown,
    mode: "live-preview",
    theme: "light",
    editorShell: "default",
    mermaidEnabled: true,
    indentGuides: true,
    indentWithTabs: true,
    indentWidth: 4,
    height: "min(68rem, calc(100vh - 5rem))",
  },
  argTypes: {
    value: { control: "object", table: { category: "Content" } },
    mode: {
      control: "select",
      options: ["live-preview", "source", "preview", "split"],
      table: { category: "View" },
    },
    theme: {
      control: "select",
      options: ["light", "dark", "system", "obsidian"],
      table: { category: "Appearance" },
    },
    editorShell: {
      control: "inline-radio",
      options: ["default", "composable"],
      table: { category: "Composition" },
    },
    mermaidEnabled: {
      control: "boolean",
      table: { category: "Features" },
    },
    indentGuides: {
      control: "boolean",
      table: { category: "Indentation" },
    },
    indentWithTabs: {
      control: "boolean",
      table: { category: "Indentation" },
    },
    indentWidth: {
      control: { type: "number", min: 1, max: 8, step: 1 },
      table: { category: "Indentation" },
    },
    height: { control: "text", table: { category: "Layout" } },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The canonical full-content Mira playground. Every fixed view uses the same Storybook-owned Markdown fixture and portable file adapter.",
      },
    },
    mira: {
      spec: "editor-and-markdown.md#supported-surfaces",
    },
  },
} satisfies Meta<typeof ComprehensiveDemoStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const LivePreview: Story = {
  name: "Live Preview",
  args: { mode: "live-preview" },
};

export const Source: Story = { args: { mode: "source" } };

export const ReadingPreview: Story = {
  name: "Reading / Preview",
  args: { mode: "preview" },
};

export const Split: Story = { args: { mode: "split" } };

export const Composable: Story = {
  args: { editorShell: "composable", mode: "live-preview" },
};
