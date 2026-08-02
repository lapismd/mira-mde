import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import { catalogParameters } from "../catalog/catalog.mjs";
import UiPrimitiveStory from "./UiPrimitiveStory.svelte";

function parameters(catalogId: string, description: string) {
  return {
    ...catalogParameters(catalogId),
    docs: { description: { story: description } },
  };
}

const meta = {
  title: "UI Primitives/Verification",
  component: UiPrimitiveStory,
  args: {
    primitive: "buttons",
  },
  argTypes: {
    primitive: { control: false },
  },
  parameters: {
    ...catalogParameters("ui-core"),
    docs: {
      description: {
        component:
          "Rendered verification for every shadcn-derived primitive family shipped by @mira-mde/ui. Each story references its catalog token contract and exercises meaningful behavior through play assertions.",
      },
    },
  },
} satisfies Meta<typeof UiPrimitiveStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ButtonsAndSeparators: Story = {
  tags: ["visual-pending"],
  parameters: parameters(
    "ui-core",
    "Button variants, icon composition, disabled state, and the shared separator surface.",
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
    await expect(canvas.getByTestId("primitive-status")).toHaveTextContent(
      "Primary action count: 1",
    );
    await expect(canvas.getByRole("separator")).toBeVisible();
  },
};

export const ToggleGroup: Story = {
  tags: ["visual-pending"],
  args: { primitive: "toggle-group" },
  parameters: parameters(
    "ui-core",
    "Single-selection editor mode group with visible and accessible pressed state.",
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const preview = canvas.getByRole("button", { name: "Preview" });
    await userEvent.click(preview);
    await expect(preview).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByTestId("primitive-status")).toHaveTextContent(
      "Selected mode: preview",
    );
  },
};

export const Toolbar: Story = {
  tags: ["visual-pending"],
  args: { primitive: "toolbar" },
  parameters: parameters(
    "ui-toolbar",
    "Toolbar buttons, multi-select formatting group, separator, and link composition.",
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bold = canvas.getByRole("button", { name: "Bold" });
    await userEvent.click(bold);
    await expect(bold).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByTestId("primitive-status")).toHaveTextContent(
      "Active formatting: bold",
    );
  },
};

export const DropdownMenu: Story = {
  tags: ["visual-pending"],
  args: { primitive: "dropdown-menu" },
  parameters: parameters(
    "ui-dropdown-menu",
    "Button-triggered actions, grouped items, shortcut, checkbox, and destructive state.",
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      canvas.getByRole("button", { name: "Open document actions" }),
    );
    await userEvent.click(
      await body.findByRole("menuitem", { name: /Duplicate/ }),
    );
    await expect(canvas.getByTestId("primitive-status")).toHaveTextContent(
      "Duplicated document",
    );
  },
};

export const ContextMenu: Story = {
  tags: ["visual-pending"],
  args: { primitive: "context-menu" },
  parameters: parameters(
    "ui-context-menu",
    "Right-click actions, grouped items, shortcut, and checkbox composition.",
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await fireEvent.contextMenu(canvas.getByTestId("context-menu-target"));
    await userEvent.click(
      await body.findByRole("menuitem", { name: /Copy block/ }),
    );
    await waitFor(() =>
      expect(body.queryByRole("menu")).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(canvasElement.ownerDocument.body).not.toHaveStyle({
        pointerEvents: "none",
      }),
    );
    await expect(canvas.getByTestId("primitive-status")).toHaveTextContent(
      "Copied block",
    );
  },
};

export const Dialog: Story = {
  tags: ["visual-pending"],
  args: { primitive: "dialog" },
  parameters: parameters(
    "ui-dialog",
    "Modal overlay, required title/description, focus handling, close, and confirmation actions.",
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      canvas.getByRole("button", { name: "Open publish dialog" }),
    );
    const dialog = await body.findByRole("dialog", {
      name: "Publish document",
    });
    await expect(dialog).toBeVisible();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Confirm publish" }),
    );
    await expect(canvas.getByTestId("primitive-status")).toHaveTextContent(
      "Document published",
    );
  },
};

export const Tooltip: Story = {
  tags: ["visual-pending"],
  args: { primitive: "tooltip" },
  parameters: parameters(
    "ui-tooltip",
    "Accessible icon-button label and zero-delay portaled tooltip content.",
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Save document" });
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await waitFor(() =>
      expect(
        canvasElement.ownerDocument.body.querySelector(
          '[data-slot="tooltip-content"]',
        ),
      ).toBeInTheDocument(),
    );
    const content = canvasElement.ownerDocument.body.querySelector<HTMLElement>(
      '[data-slot="tooltip-content"]',
    );
    await expect(content).toHaveTextContent("Save document");
    await expect(trigger).toHaveAttribute("aria-describedby", content?.id);
  },
};

export const Table: Story = {
  tags: ["visual-pending"],
  args: { primitive: "table" },
  parameters: parameters(
    "ui-table",
    "Semantic caption, header, body, footer, row, head, and cell composition.",
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole("table", { name: "Package surface matrix" });
    await expect(table).toBeVisible();
    await expect(within(table).getAllByRole("row")).toHaveLength(5);
    await expect(within(table).getByText("@mira-mde/preview")).toBeVisible();
  },
};

export const ScrollArea: Story = {
  tags: ["visual-pending"],
  args: { primitive: "scroll-area" },
  parameters: parameters(
    "ui-core",
    "Bounded overflow ownership for a long document list.",
  ),
  play: async ({ canvasElement }) => {
    const scrollArea = canvasElement.querySelector<HTMLElement>(
      ".mira-ui-story__scroll-area",
    );
    if (!scrollArea) throw new Error("Scroll area did not render");
    await expect(scrollArea.scrollHeight).toBeGreaterThan(
      scrollArea.clientHeight,
    );
    scrollArea.scrollTop = scrollArea.scrollHeight;
    await fireEvent.scroll(scrollArea);
    await expect(scrollArea.scrollTop).toBeGreaterThan(0);
  },
};
