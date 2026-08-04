import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import { catalogParameters } from "../catalog/catalog.mjs";
import ComprehensiveDemoStory from "./ComprehensiveDemoStory.svelte";
import comprehensiveMarkdown from "./comprehensive-demo.md?raw";

const meta = {
  title: "Demo/Comprehensive",
  component: ComprehensiveDemoStory,
  tags: ["visual-pending"],
  args: {
    value: comprehensiveMarkdown,
    mode: "live-preview",
    theme: "",
    colorMode: "inherit",
    editorShell: "default",
    mermaidEnabled: true,
    outline: true,
    outlineVariant: "floating",
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
      control: "text",
      table: { category: "Appearance" },
    },
    colorMode: {
      control: "select",
      options: ["inherit", "light", "dark", "system"],
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
    outline: {
      control: "boolean",
      description: "Show heading navigation beside reading and split views.",
      table: { category: "Features" },
    },
    outlineVariant: {
      control: "inline-radio",
      options: ["floating", "sidebar"],
      description: "Use the floating marker rail or persistent side panel.",
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
    ...catalogParameters("storybook-comprehensive"),
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The canonical full-content Mira playground. Every fixed view uses the same Storybook-owned Markdown fixture and portable file adapter.",
      },
    },
  },
} satisfies Meta<typeof ComprehensiveDemoStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: ["/visual-baselines/stories/demo/playground-chromium.png"],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const editor = canvasElement.querySelector<HTMLElement>(".mira");
    if (!editor) throw new Error("Comprehensive editor did not render");

    await step("switch between full editor views", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Split" }));
      await expect(editor).toHaveAttribute("data-mode", "split");

      await userEvent.click(
        canvas.getByRole("button", { name: "Reading view" }),
      );
      await expect(editor).toHaveAttribute("data-mode", "preview");
      await expect(
        canvas.getByRole("group", { name: "Document outline" }),
      ).toBeVisible();

      await userEvent.click(canvas.getByRole("button", { name: "Edit" }));
      await expect(editor).toHaveAttribute("data-mode", "live-preview");
    });

    await step("select source mode from the overflow menu", async () => {
      await userEvent.click(
        canvas.getByRole("button", { name: "View options" }),
      );
      const body = within(canvasElement.ownerDocument.body);
      await userEvent.click(
        body.getByText("Source mode", { selector: "span" }),
      );
      await expect(editor).toHaveAttribute("data-mode", "source");
    });
  },
};

export const LivePreview: Story = {
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: ["/visual-baselines/stories/demo/live-preview-chromium.png"],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Live Preview",
  args: { mode: "live-preview" },
};

export const Source: Story = {
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: ["/visual-baselines/stories/demo/source-chromium.png"],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  args: { mode: "source" },
};

export const ReadingPreview: Story = {
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: ["/visual-baselines/stories/demo/reading-preview-chromium.png"],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Reading / Preview",
  args: { mode: "preview" },
};

export const Split: Story = {
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: ["/visual-baselines/stories/demo/split-chromium.png"],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  args: { mode: "split" },
};

export const Composable: Story = {
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: ["/visual-baselines/stories/demo/composable-chromium.png"],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  args: { editorShell: "composable", mode: "live-preview" },
};
