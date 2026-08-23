import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import EditorModeStory from "../_shared/EditorModeStory.svelte";
import MarkdownPreviewStory from "../_shared/MarkdownPreviewStory.svelte";
import {
  markdownEditorDocsSource,
  markdownPreviewDocsSource,
} from "../_shared/docs-source";
import { frontmatterMarkdown } from "../fixtures";
import FrontmatterActionsStory from "./FrontmatterActionsStory.svelte";

const meta = {
  title: "Markdown/Frontmatter",
  component: MarkdownPreviewStory,
  args: {
    value: frontmatterMarkdown,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Frontmatter stores document properties before the Markdown body.",
      },
      source: {
        language: "html",
        type: "code",
        code: markdownPreviewDocsSource("frontmatterMarkdown"),
      },
    },
  },
} satisfies Meta<typeof MarkdownPreviewStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/frontmatter/preview-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
};

export const LivePreview: Story = {
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
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
        "/visual-baselines/stories/markdown/frontmatter/live-preview-chromium.png",
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
        code: markdownEditorDocsSource("frontmatterMarkdown", "live-preview"),
      },
    },
  },
};

export const SourceMode: Story = {
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
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
        "/visual-baselines/stories/markdown/frontmatter/source-mode-chromium.png",
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
        code: markdownEditorDocsSource("frontmatterMarkdown", "source"),
      },
    },
  },
};

export const PropertyActions: Story = {
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/frontmatter/property-actions-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Property actions and suggestions",
  render: () => ({
    Component: FrontmatterActionsStory,
  }),
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("collapse and expand the property editor", async () => {
      await userEvent.click(
        canvas.getByRole("button", { name: "Collapse properties" }),
      );
      await expect(
        canvas.getByRole("button", { name: "Expand properties" }),
      ).toHaveAttribute("aria-expanded", "false");
      await userEvent.click(
        canvas.getByRole("button", { name: "Expand properties" }),
      );
    });

    await step("edit and remove a property", async () => {
      const statusValue = canvas.getByRole("textbox", {
        name: "status value",
      });
      await userEvent.clear(statusValue);
      await userEvent.type(statusValue, "approved");
      await userEvent.tab();
      await expect(statusValue).toHaveTextContent("approved");

      await userEvent.click(
        canvas.getByRole("button", { name: "Change status type" }),
      );
      const typeMenu = canvas.getByRole("menu", {
        name: "Property type for status",
      });
      const textType = within(typeMenu).getByRole("menuitemradio", {
        name: "Text",
      });
      await expect(typeMenu).toBeVisible();
      await expect(textType).toBeVisible();
      const statusRow = typeMenu.closest<HTMLElement>(".metadata-property");
      expect(statusRow).not.toBeNull();
      expect(typeMenu.getBoundingClientRect().bottom).toBeGreaterThan(
        statusRow!.getBoundingClientRect().bottom,
      );
      const textTypeBounds = textType.getBoundingClientRect();
      const hit = canvasElement.ownerDocument.elementFromPoint(
        textTypeBounds.left + textTypeBounds.width / 2,
        textTypeBounds.top + textTypeBounds.height / 2,
      );
      expect(
        hit === textType || textType.contains(hit),
        `Expected the Text item to own its center point; hit ${hit?.tagName ?? "nothing"}.${hit instanceof HTMLElement ? hit.className : ""} in ${hit instanceof HTMLElement ? hit.closest<HTMLElement>(".metadata-property")?.dataset.property : "no row"}; menu z=${getComputedStyle(typeMenu).zIndex}, row z=${getComputedStyle(statusRow!).zIndex}, row overflow=${getComputedStyle(statusRow!).overflow}`,
      ).toBe(true);
      await userEvent.click(canvas.getByRole("menuitem", { name: "Remove" }));
      await expect(
        canvas.queryByRole("textbox", { name: "status value" }),
      ).not.toBeInTheDocument();
    });
  },
};
