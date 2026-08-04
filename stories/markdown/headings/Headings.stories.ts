import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import EditorModeStory from "../_shared/EditorModeStory.svelte";
import MarkdownPreviewStory from "../_shared/MarkdownPreviewStory.svelte";
import {
  markdownEditorDocsSource,
  markdownOutlineDocsSource,
  markdownPreviewDocsSource,
} from "../_shared/docs-source";
import { headingsMarkdown } from "../fixtures";

const meta = {
  title: "Markdown/Headings",
  component: MarkdownPreviewStory,
  args: {
    value: headingsMarkdown,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Headings create the document outline used by reading and editor surfaces.",
      },
      source: {
        language: "html",
        type: "code",
        code: markdownPreviewDocsSource("headingsMarkdown"),
      },
    },
  },
} satisfies Meta<typeof MarkdownPreviewStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {
  tags: ["visual-ready"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/headings/preview-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
};

export const OutlineNavigation: Story = {
  tags: ["visual-ready"],
  name: "Outline Navigation",
  render: (args) => ({
    Component: EditorModeStory,
    props: {
      ...args,
      mode: "preview",
      outline: true,
      height: "18rem",
    },
  }),
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/headings/outline-navigation-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
    docs: {
      description: {
        story:
          "The opt-in outline stays beside the reading preview and navigates to the matching generated heading ID.",
      },
      source: {
        language: "html",
        type: "code",
        code: markdownOutlineDocsSource("headingsMarkdown"),
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const preview = canvasElement.querySelector<HTMLElement>(
      ".mira-markdown-preview",
    );
    if (!preview) throw new Error("Reading preview did not render");

    await step("navigate from the outline to a rendered heading", async () => {
      const group = canvas.getByRole("group", { name: "Document outline" });
      const marker = canvas.getByRole("button", {
        name: "Open outline and scroll to Heading 4",
      });
      const target = canvasElement.querySelector<HTMLElement>("#heading-4");
      if (!target) throw new Error("Outline target heading did not render");

      await expect(group).toBeVisible();
      await expect(target).toHaveAttribute("id", "heading-4");
      await userEvent.click(marker);

      const outline = canvas.getByRole("navigation", {
        name: "Table of contents",
      });
      await expect(outline).toBeVisible();
      await expect(within(outline).getByText("On this page")).toBeVisible();
      await expect(marker).toHaveAttribute("aria-current", "true");
      await waitFor(
        () => {
          expect(preview.scrollTop).toBeGreaterThan(0);
          expect(canvasElement.ownerDocument.activeElement).toBe(target);
        },
        { timeout: 2_000 },
      );
    });
  },
};

export const OutlineSidebar: Story = {
  tags: ["visual-ready"],
  name: "Outline Sidebar",
  render: (args) => ({
    Component: EditorModeStory,
    props: {
      ...args,
      mode: "preview",
      outline: true,
      outlineVariant: "sidebar",
      height: "18rem",
    },
  }),
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/headings/outline-sidebar-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
    docs: {
      description: {
        story:
          "The persistent sidebar keeps the original always-visible outline layout as an explicit variant.",
      },
      source: {
        language: "html",
        type: "code",
        code: markdownOutlineDocsSource("headingsMarkdown", "sidebar"),
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const outline = canvas.getByRole("navigation", {
      name: "Table of contents",
    });
    const link = within(outline).getByRole("link", { name: "Heading 4" });
    const target = canvasElement.querySelector<HTMLElement>("#heading-4");

    await expect(outline).toBeVisible();
    await expect(link).toHaveAttribute("href", "#heading-4");
    await expect(target).toHaveAttribute("id", "heading-4");
  },
};

export const LivePreview: Story = {
  tags: ["visual-ready"],
  name: "Live Preview",
  render: (args) => ({
    Component: EditorModeStory,
    props: {
      ...args,
      mode: "live-preview",
    },
  }),
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/headings/live-preview-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
    docs: {
      source: {
        language: "html",
        type: "code",
        code: markdownEditorDocsSource("headingsMarkdown", "live-preview"),
      },
    },
  },
};

export const SourceMode: Story = {
  tags: ["visual-ready"],
  name: "Source Mode",
  render: (args) => ({
    Component: EditorModeStory,
    props: {
      ...args,
      mode: "source",
    },
  }),
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/headings/source-mode-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
    docs: {
      source: {
        language: "html",
        type: "code",
        code: markdownEditorDocsSource("headingsMarkdown", "source"),
      },
    },
  },
};
