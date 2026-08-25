import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
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
    "visual-pending",
    "!visual-approved",
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

      const page = within(canvasElement.ownerDocument.body);
      const statusTrigger = canvas.getByRole("button", {
        name: "Property options for status",
      });
      await userEvent.click(statusTrigger);
      const statusRow =
        statusTrigger.closest<HTMLElement>(".metadata-property");
      const optionsMenu = page.getByRole("menu", {
        name: "Property options for status",
      });
      const propertyType = within(optionsMenu).getByRole("menuitem", {
        name: "Property type",
      });
      await expect(optionsMenu).toBeVisible();
      await expect(
        within(optionsMenu)
          .getAllByRole("menuitem")
          .map((item) => item.textContent?.trim()),
      ).toEqual(["Property type", "Cut", "Copy", "Paste", "Remove"]);
      await expect(
        within(optionsMenu).queryByRole("menuitemcheckbox", {
          name: "Number",
        }),
      ).not.toBeInTheDocument();

      propertyType.focus();
      await userEvent.keyboard("{ArrowRight}");
      const typeMenu = page.getByRole("menu", {
        name: "Property type for status",
      });
      const numberType = within(typeMenu).getByRole("menuitemcheckbox", {
        name: "Number",
      });
      const textType = within(typeMenu).getByRole("menuitemcheckbox", {
        name: "Text",
      });
      await expect(typeMenu).toBeVisible();
      await expect(numberType).toBeVisible();
      await expect(numberType).toHaveAttribute("aria-checked", "false");
      expect(numberType.firstElementChild?.querySelector("svg")).toBeNull();
      expect(
        numberType.querySelector(".metadata-property-type-menu__type-icon"),
      ).not.toBeNull();
      await expect(textType).toHaveAttribute("aria-checked", "true");
      expect(textType.firstElementChild?.querySelector("svg")).not.toBeNull();
      expect(
        textType.querySelector(".metadata-property-type-menu__type-icon"),
      ).not.toBeNull();
      expect(statusRow).not.toBeNull();
      expect(statusRow!.contains(typeMenu)).toBe(false);
      expect(typeMenu.getBoundingClientRect().bottom).toBeGreaterThan(
        statusRow!.getBoundingClientRect().bottom,
      );
      const numberTypeBounds = numberType.getBoundingClientRect();
      const hit = canvasElement.ownerDocument.elementFromPoint(
        numberTypeBounds.left + numberTypeBounds.width / 2,
        numberTypeBounds.top + numberTypeBounds.height / 2,
      );
      expect(
        hit === numberType || numberType.contains(hit),
        `Expected the Number item to own its center point; hit ${hit?.tagName ?? "nothing"}.${hit instanceof HTMLElement ? hit.className : ""} in ${hit instanceof HTMLElement ? hit.closest<HTMLElement>(".metadata-property")?.dataset.property : "no row"}; menu z=${getComputedStyle(typeMenu).zIndex}, row z=${getComputedStyle(statusRow!).zIndex}, row overflow=${getComputedStyle(statusRow!).overflow}`,
      ).toBe(true);
      await userEvent.click(numberType);
      await waitFor(() => {
        expect(
          canvas.getByRole("button", {
            name: "Property options for status",
          }),
        ).toHaveAttribute("aria-expanded", "false");
        expect(
          getComputedStyle(canvasElement.ownerDocument.body).pointerEvents,
        ).not.toBe("none");
      });
      await userEvent.click(
        canvas.getByRole("button", { name: "Property options for status" }),
      );
      await userEvent.click(page.getByRole("menuitem", { name: "Remove" }));
      await expect(
        canvas.queryByRole("button", { name: "Property options for status" }),
      ).not.toBeInTheDocument();
      await waitFor(() => {
        expect(
          getComputedStyle(canvasElement.ownerDocument.body).pointerEvents,
        ).not.toBe("none");
      });
    });

    await step("leave the standard property type submenu visible", async () => {
      await userEvent.click(
        canvas.getByRole("button", { name: "Property options for title" }),
      );
      const page = within(canvasElement.ownerDocument.body);
      const propertyType = within(
        page.getByRole("menu", { name: "Property options for title" }),
      ).getByRole("menuitem", { name: "Property type" });
      await userEvent.hover(propertyType);
      await expect(
        page.getByRole("menu", { name: "Property type for title" }),
      ).toBeVisible();
    });
  },
};
