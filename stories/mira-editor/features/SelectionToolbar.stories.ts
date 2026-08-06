import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { catalogParameters } from "../../catalog/catalog.mjs";
import SelectionToolbarStory from "./SelectionToolbarStory.svelte";

const meta = {
  title: "Mira Editor/Features/Selection Toolbar",
  component: SelectionToolbarStory,
  tags: ["visual-pending"],
  args: {
    value:
      "Select this highlighted text to reveal contextual formatting controls.",
    mode: "source",
  },
  parameters: {
    ...catalogParameters("mira"),
    docs: {
      description: {
        component:
          "Opt-in selected-text formatting toolbar with its own compact bordered floating surface.",
      },
    },
  },
} satisfies Meta<typeof SelectionToolbarStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default",
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>(
      "[data-selection-toolbar-story]",
    );
    if (!root) throw new Error("Selection toolbar story did not render");
    const toolbar = await waitFor(() =>
      canvas.getByRole("toolbar", { name: "Text formatting" }),
    );

    await step("show the bordered toolbar beneath selected text", async () => {
      const toolbarStyle = getComputedStyle(toolbar);
      expect(toolbarStyle.visibility).toBe("visible");
      expect(toolbarStyle.borderTopStyle).toBe("solid");
      expect(toolbarStyle.borderBottomStyle).toBe("solid");
      expect(Number.parseFloat(toolbarStyle.borderTopWidth)).toBeGreaterThan(0);
      expect(Number.parseFloat(toolbarStyle.borderBottomWidth)).toBeGreaterThan(
        0,
      );
      expect(toolbarStyle.boxShadow).toContain("inset");
      expect(Number.parseFloat(toolbarStyle.borderRadius)).toBeGreaterThan(16);
      expect(toolbar).toHaveAttribute("data-placement", "below");
      const buttons = within(toolbar).getAllByRole("button");
      for (const button of buttons) {
        const bounds = button.getBoundingClientRect();
        expect(Math.abs(bounds.width - bounds.height)).toBeLessThan(0.5);
        expect(Number.parseFloat(getComputedStyle(button).borderRadius)).toBe(
          999,
        );
        expect(button).toHaveAttribute("aria-pressed", "false");
      }
      expect(root).toHaveAttribute(
        "data-markdown-value",
        "Select this highlighted text to reveal contextual formatting controls.",
      );
    });

    await step("reach and navigate the toolbar from the keyboard", async () => {
      const editor = canvasElement.querySelector<HTMLElement>(".cm-content");
      expect(editor).not.toBeNull();
      editor?.focus();
      await userEvent.keyboard("{Tab}");
      expect(canvasElement.ownerDocument.activeElement).toHaveAttribute(
        "aria-label",
        "Link",
      );
      await userEvent.keyboard("{ArrowRight}");
      expect(canvasElement.ownerDocument.activeElement).toHaveAttribute(
        "aria-label",
        "Bold",
      );
      await userEvent.keyboard("{Escape}");
      expect(canvasElement.ownerDocument.activeElement).toBe(editor);
    });

    await step("hide on blur and return on focus", async () => {
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await waitFor(() =>
        expect(getComputedStyle(toolbar).visibility).toBe("hidden"),
      );
      canvasElement.querySelector<HTMLElement>(".cm-content")?.focus();
      await waitFor(() =>
        expect(getComputedStyle(toolbar).visibility).toBe("visible"),
      );
    });

    await step(
      "use the shared action without losing the selection",
      async () => {
        await userEvent.click(
          within(toolbar).getByRole("button", { name: "Bold" }),
        );
        await waitFor(() =>
          expect(root).toHaveAttribute(
            "data-markdown-value",
            "Select this **highlighted text** to reveal contextual formatting controls.",
          ),
        );
        expect(
          within(
            canvas.getByRole("toolbar", { name: "Text formatting" }),
          ).getByRole("button", { name: "Bold" }),
        ).toHaveAttribute("aria-pressed", "true");
        const updatedToolbar = canvas.getByRole("toolbar", {
          name: "Text formatting",
        });
        await userEvent.click(
          within(updatedToolbar).getByRole("button", { name: "Bold" }),
        );
        await waitFor(() =>
          expect(root).toHaveAttribute(
            "data-markdown-value",
            "Select this highlighted text to reveal contextual formatting controls.",
          ),
        );
        expect(
          within(
            canvas.getByRole("toolbar", { name: "Text formatting" }),
          ).getByRole("button", { name: "Bold" }),
        ).toHaveAttribute("aria-pressed", "false");
      },
    );
  },
};

export const ActiveFormatting: Story = {
  name: "Active formatting",
  args: {
    value:
      "Select this **highlighted text** to reveal contextual formatting controls.",
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>(
      "[data-selection-toolbar-story]",
    );
    if (!root) throw new Error("Selection toolbar story did not render");

    await step("reflect the selected Markdown formatting", async () => {
      const bold = await waitFor(() =>
        within(
          canvas.getByRole("toolbar", { name: "Text formatting" }),
        ).getByRole("button", { name: "Bold" }),
      );
      expect(bold).toHaveAttribute("aria-pressed", "true");
    });

    await step("remove and restore the selected formatting", async () => {
      await userEvent.click(
        within(
          canvas.getByRole("toolbar", { name: "Text formatting" }),
        ).getByRole("button", { name: "Bold" }),
      );
      await waitFor(() =>
        expect(root).toHaveAttribute(
          "data-markdown-value",
          "Select this highlighted text to reveal contextual formatting controls.",
        ),
      );
      expect(
        within(
          canvas.getByRole("toolbar", { name: "Text formatting" }),
        ).getByRole("button", { name: "Bold" }),
      ).toHaveAttribute("aria-pressed", "false");

      await userEvent.click(
        within(
          canvas.getByRole("toolbar", { name: "Text formatting" }),
        ).getByRole("button", { name: "Bold" }),
      );
      await waitFor(() =>
        expect(root).toHaveAttribute(
          "data-markdown-value",
          "Select this **highlighted text** to reveal contextual formatting controls.",
        ),
      );
      expect(
        within(
          canvas.getByRole("toolbar", { name: "Text formatting" }),
        ).getByRole("button", { name: "Bold" }),
      ).toHaveAttribute("aria-pressed", "true");
    });
  },
};
