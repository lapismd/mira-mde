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
    "visual-pending",
    "!visual-approved",
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
    "visual-pending",
    "!visual-approved",
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

    await step("paint list pills and their remove controls", async () => {
      for (const label of ["markdown", "Markdown metadata"]) {
        const pill = canvas
          .getByText(label, { exact: true })
          .closest<HTMLElement>(".metadata-property-pill-chip");
        const remove = canvas.getByRole("button", {
          name: `Remove ${label}`,
        });
        const icon = remove.querySelector<SVGElement>("svg");
        expect(pill).not.toBeNull();
        expect(getComputedStyle(pill as HTMLElement).backgroundColor).not.toBe(
          "rgba(0, 0, 0, 0)",
        );
        expect(icon?.querySelector('path[d="M18 6 6 18"]')).not.toBeNull();
        expect(icon?.querySelector('path[d="m6 6 12 12"]')).not.toBeNull();
        expect(icon?.getBoundingClientRect().width ?? 0).toBeGreaterThanOrEqual(
          9,
        );
      }
    });

    await step(
      "commit custom list values while suggestions remain advisory",
      async () => {
        const page = within(canvasElement.ownerDocument.body);
        let tagsValue = canvas.getByRole("combobox", { name: "tags value" });
        await userEvent.click(tagsValue);
        await userEvent.type(tagsValue, "rel");
        await expect(tagsValue).toHaveValue("rel");
        const releaseOption = await page.findByRole("option", {
          name: "release",
        });
        await expect(releaseOption).toHaveAttribute("aria-selected", "false");
        await userEvent.keyboard("{Enter}");
        await expect(canvas.getByText("rel", { exact: true })).toBeVisible();
        await expect(
          canvas.queryByText("release", { exact: true }),
        ).not.toBeInTheDocument();

        const longTag =
          "topic/financial-planning-and-long-term-investing-with-custom-scenarios-and-review-notes";
        tagsValue = canvas.getByRole("combobox", { name: "tags value" });
        await userEvent.clear(tagsValue);
        await userEvent.type(tagsValue, longTag);
        await expect(tagsValue).toHaveValue(longTag);
        await userEvent.keyboard("{Enter}");
        const longTagLabel = canvas.getByText(longTag, { exact: true });
        const longTagPill = longTagLabel.closest<HTMLElement>(
          ".metadata-property-pill-chip",
        );
        const aliasPill = canvas
          .getByText("Markdown metadata", { exact: true })
          .closest<HTMLElement>(".metadata-property-pill-chip");
        expect(longTagPill).not.toBeNull();
        expect(aliasPill).not.toBeNull();
        expect(getComputedStyle(longTagLabel).whiteSpace).toBe("normal");
        expect(getComputedStyle(longTagLabel).overflowWrap).toBe("anywhere");
        expect(getComputedStyle(longTagLabel).textOverflow).toBe("clip");
        expect(getComputedStyle(longTagPill as HTMLElement).borderRadius).toBe(
          getComputedStyle(aliasPill as HTMLElement).borderRadius,
        );
        expect(
          getComputedStyle(longTagPill as HTMLElement).backgroundColor,
        ).not.toBe("rgba(0, 0, 0, 0)");
        const tagBounds = (longTagPill as HTMLElement).getBoundingClientRect();
        const tagLabelBounds = longTagLabel.getBoundingClientRect();
        expect(tagLabelBounds.left).toBeGreaterThan(tagBounds.left);
        expect(tagLabelBounds.top).toBeGreaterThan(tagBounds.top);
        expect(tagLabelBounds.right).toBeLessThan(tagBounds.right);
        expect(tagLabelBounds.bottom).toBeLessThan(tagBounds.bottom);
      },
    );

    await step("edit and remove a property", async () => {
      const page = within(canvasElement.ownerDocument.body);
      let statusValue = canvas.getByRole("combobox", {
        name: "status value",
      });
      await userEvent.clear(statusValue);
      await userEvent.type(statusValue, "app");
      const statusRow = statusValue.closest<HTMLElement>(".metadata-property");
      const approvedOption = await page.findByRole("option", {
        name: "approved",
      });
      await expect(approvedOption).toHaveAttribute("aria-selected", "false");
      const suggestionList = approvedOption.closest<HTMLElement>(
        ".mira-property-value-suggestions",
      );
      expect(statusRow).not.toBeNull();
      expect(suggestionList).not.toBeNull();
      expect(statusRow?.contains(suggestionList)).toBe(false);
      const optionBounds = approvedOption.getBoundingClientRect();
      const optionHit = canvasElement.ownerDocument.elementFromPoint(
        optionBounds.left + optionBounds.width / 2,
        optionBounds.top + optionBounds.height / 2,
      );
      expect(
        optionHit === approvedOption || approvedOption.contains(optionHit),
      ).toBe(true);
      await userEvent.keyboard("{Enter}");
      statusValue = canvas.getByRole("combobox", { name: "status value" });
      await expect(statusValue).toHaveTextContent("app");

      await userEvent.clear(statusValue);
      await userEvent.type(statusValue, "app");
      await userEvent.click(
        await page.findByRole("option", { name: "approved" }),
      );
      statusValue = canvas.getByRole("combobox", { name: "status value" });
      await expect(statusValue).toHaveTextContent("approved");

      const statusTrigger = canvas.getByRole("button", {
        name: "Property options for status",
      });
      await userEvent.click(statusTrigger);
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
