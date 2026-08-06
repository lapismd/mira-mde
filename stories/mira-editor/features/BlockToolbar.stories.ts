import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { catalogParameters } from "../../catalog/catalog.mjs";
import BlockToolbarStory from "./BlockToolbarStory.svelte";

const fixture = `- [?] Custom task

# Heading one

## Heading two

### Heading three

Paragraph block

This deliberately long wrapped paragraph demonstrates that the block trigger remains aligned with the first visual row while the content continues naturally onto additional rows inside a constrained editor surface.

- Bullet item

> Quoted block

\`\`\`ts
const richBlock = true;
\`\`\``;

const meta = {
  title: "Mira Editor/Features/Block Toolbar",
  component: BlockToolbarStory,
  tags: ["visual-pending"],
  args: {
    value: fixture,
    mode: "source",
    openMenu: false,
  },
  parameters: {
    ...catalogParameters("mira"),
    docs: {
      description: {
        component:
          "Opt-in semantic block trigger and anchored structural menu beside Mira's existing drag handle.",
      },
    },
  },
} satisfies Meta<typeof BlockToolbarStory>;

export default meta;
type Story = StoryObj<typeof meta>;

type Position = { line: number; ch: number };

function storyRoot(canvasElement: HTMLElement): HTMLElement {
  const root = canvasElement.querySelector<HTMLElement>(
    "[data-block-toolbar-story]",
  );
  if (!root) throw new Error("Block toolbar story did not render");
  return root;
}

async function setupBlock(
  canvasElement: HTMLElement,
  markdown: string,
  position: Position = { line: 0, ch: 0 },
): Promise<HTMLButtonElement> {
  const root = storyRoot(canvasElement);
  root.dispatchEvent(
    new CustomEvent("mira-story-set-active-block", {
      detail: { markdown, line: position.line, ch: position.ch },
    }),
  );
  await waitFor(() =>
    expect(root).toHaveAttribute("data-markdown-value", markdown),
  );
  return waitFor(() => {
    const trigger = root.querySelector<HTMLButtonElement>(
      ".mira-block-toolbar-trigger--active",
    );
    expect(trigger).not.toBeNull();
    return trigger!;
  });
}

async function chooseBlockType(
  canvasElement: HTMLElement,
  label: string,
): Promise<void> {
  const root = storyRoot(canvasElement);
  const trigger = root.querySelector<HTMLButtonElement>(
    ".mira-block-toolbar-trigger--active",
  );
  if (!trigger) throw new Error("Active block trigger is unavailable");
  await userEvent.click(trigger);
  const menu = await waitFor(() =>
    within(canvasElement.ownerDocument.body).getByRole("menu", {
      name: "Change block type",
    }),
  );
  await userEvent.click(
    within(menu).getByRole("menuitemradio", {
      name: new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
    }),
  );
}

async function expectMarkdown(
  canvasElement: HTMLElement,
  markdown: string,
): Promise<void> {
  await waitFor(() =>
    expect(storyRoot(canvasElement)).toHaveAttribute(
      "data-markdown-value",
      markdown,
    ),
  );
}

async function runBlockToolbarAcceptance({
  canvasElement,
  step,
}: {
  canvasElement: HTMLElement;
  step: (name: string, run: () => Promise<void>) => Promise<void>;
}): Promise<void> {
  await step(
    "convert paragraphs to every default structural type",
    async () => {
      for (const [label, expected] of [
        ["Task", "- [ ] Paragraph"],
        ["Heading 1", "# Paragraph"],
        ["Heading 2", "## Paragraph"],
        ["Heading 3", "### Paragraph"],
        ["Bullet list", "- Paragraph"],
        ["Numbered list", "1. Paragraph"],
        ["Blockquote", "> Paragraph"],
      ] as const) {
        await setupBlock(canvasElement, "Paragraph", { line: 0, ch: 4 });
        await chooseBlockType(canvasElement, label);
        await expectMarkdown(canvasElement, expected);
      }
    },
  );

  await step("convert a heading back to a paragraph", async () => {
    await setupBlock(canvasElement, "# Heading", { line: 0, ch: 4 });
    await chooseBlockType(canvasElement, "Paragraph");
    await expectMarkdown(canvasElement, "Heading");
  });

  await step("insert a divider without discarding block content", async () => {
    await setupBlock(canvasElement, "Paragraph", { line: 0, ch: 4 });
    const root = storyRoot(canvasElement);
    await userEvent.click(
      root.querySelector<HTMLButtonElement>(
        ".mira-block-toolbar-trigger--active",
      )!,
    );
    const menu = await waitFor(() =>
      within(canvasElement.ownerDocument.body).getByRole("menu", {
        name: "Change block type",
      }),
    );
    await userEvent.click(
      within(menu).getByRole("menuitemradio", { name: "Divider" }),
    );
    await expectMarkdown(canvasElement, "Paragraph\n\n---\n");
  });

  await step(
    "run a custom block-menu action against the targeted range",
    async () => {
      await setupBlock(canvasElement, "Paragraph", { line: 0, ch: 4 });
      const root = storyRoot(canvasElement);
      await userEvent.click(
        root.querySelector<HTMLButtonElement>(
          ".mira-block-toolbar-trigger--active",
        )!,
      );
      const menu = await waitFor(() =>
        within(canvasElement.ownerDocument.body).getByRole("menu", {
          name: "Change block type",
        }),
      );
      await userEvent.click(
        within(menu).getByRole("menuitem", { name: /^Mark block/ }),
      );
      await expectMarkdown(canvasElement, "✨ Paragraph");
    },
  );

  await step("disable structural conversion for rich blocks", async () => {
    const trigger = await setupBlock(canvasElement, "```ts\ncode\n```", {
      line: 1,
      ch: 2,
    });
    expect(trigger).toHaveAccessibleName("Change Code block");
    await userEvent.click(trigger);
    const menu = await waitFor(() =>
      within(canvasElement.ownerDocument.body).getByRole("menu", {
        name: "Change block type",
      }),
    );
    expect(
      within(menu).getByRole("menuitemradio", { name: "Paragraph" }),
    ).toBeDisabled();
  });
}

export const Source: Story = {
  name: "Source",
  play: runBlockToolbarAcceptance,
};

export const LivePreview: Story = {
  name: "Live Preview",
  args: { mode: "live-preview" },
  play: runBlockToolbarAcceptance,
};

export const OpenMenu: Story = {
  name: "Open menu",
  args: { openMenu: true },
  play: async ({ canvasElement, step }) => {
    const root = storyRoot(canvasElement);
    const menu = await waitFor(() =>
      within(canvasElement.ownerDocument.body).getByRole("menu", {
        name: "Change block type",
      }),
    );

    await step("show the distinctive anchored menu surface", async () => {
      const style = getComputedStyle(menu);
      expect(style.borderTopStyle).toBe("solid");
      expect(style.borderBottomStyle).toBe("solid");
      expect(Number.parseFloat(style.borderTopWidth)).toBeGreaterThan(0);
      expect(Number.parseFloat(style.borderRadius)).toBeGreaterThan(8);
      expect(style.boxShadow).not.toBe("none");
      expect(
        within(menu).getByRole("menuitem", { name: /^Mark block/ }),
      ).toBeVisible();
      const expandedTrigger = await waitFor(() => {
        const current = root.querySelector<HTMLButtonElement>(
          '.mira-block-toolbar-trigger[aria-expanded="true"]',
        );
        expect(current).not.toBeNull();
        return current!;
      });
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const menuRect = menu.getBoundingClientRect();
      const triggerRect = expandedTrigger.getBoundingClientRect();
      const viewportBottom =
        canvasElement.ownerDocument.defaultView!.innerHeight;
      if (triggerRect.top + menuRect.height > viewportBottom - 8) {
        expect(Math.abs(menuRect.bottom - (viewportBottom - 8))).toBeLessThan(
          1.5,
        );
      } else {
        expect(Math.abs(menuRect.top - triggerRect.top)).toBeLessThan(1.5);
      }
    });

    await step(
      "keep circular trigger and wrapped row geometry stable",
      async () => {
        const trigger = await waitFor(() => {
          const current = root.querySelector<HTMLButtonElement>(
            '.mira-block-toolbar-trigger[aria-expanded="true"]',
          );
          expect(current).not.toBeNull();
          return current!;
        });
        const triggerRect = trigger.getBoundingClientRect();
        expect(Math.abs(triggerRect.width - triggerRect.height)).toBeLessThan(
          0.5,
        );
        expect(triggerRect.width).toBeLessThanOrEqual(25);
        expect(triggerRect.width).toBeGreaterThanOrEqual(23);
        expect(
          Number.parseFloat(getComputedStyle(trigger).borderRadius),
        ).toBeGreaterThan(triggerRect.width / 2 - 1);

        const line = Array.from(
          root.querySelectorAll<HTMLElement>(".cm-line"),
        ).find((candidate) =>
          candidate.textContent?.includes("This deliberately"),
        );
        expect(line).not.toBeUndefined();
        const lineRect = line!.getBoundingClientRect();
        expect(Math.abs(triggerRect.top - lineRect.top)).toBeLessThan(1.5);
        expect(lineRect.height).toBeGreaterThan(
          Number.parseFloat(getComputedStyle(line!).lineHeight) * 1.5,
        );
        expect(triggerRect.right).toBeLessThanOrEqual(lineRect.left + 0.5);
        expect(lineRect.left - triggerRect.right).toBeGreaterThanOrEqual(17);
        expect(lineRect.left - triggerRect.right).toBeLessThanOrEqual(19);

        const headingLine = Array.from(
          root.querySelectorAll<HTMLElement>(".cm-line"),
        ).find((candidate) => candidate.textContent?.includes("Heading one"));
        const foldIndicator =
          headingLine?.querySelector<HTMLElement>(".cm-fold-indicator");
        const collapseButton = foldIndicator?.querySelector<HTMLElement>(
          ".collapse-indicator",
        );
        expect(foldIndicator).not.toBeNull();
        expect(collapseButton).not.toBeNull();
        const headingLineRect = headingLine!.getBoundingClientRect();
        const foldRect = foldIndicator!.getBoundingClientRect();
        const collapseRect = collapseButton!.getBoundingClientRect();
        expect(foldRect.width).toBeLessThan(0.5);
        expect(collapseRect.width).toBeGreaterThanOrEqual(15);
        expect(Math.abs(headingLineRect.left - lineRect.left)).toBeLessThan(
          0.5,
        );
        expect(collapseRect.left).toBeGreaterThanOrEqual(
          triggerRect.right - 0.5,
        );
        expect(collapseRect.right).toBeLessThanOrEqual(
          headingLineRect.left + 0.5,
        );

        const gutter = root.querySelector<HTMLElement>(
          ".mira-block-controls-gutter",
        )!;
        const widthWhileOpen = gutter.getBoundingClientRect().width;
        await userEvent.keyboard("{Escape}");
        expect(gutter.getBoundingClientRect().width).toBeCloseTo(
          widthWhileOpen,
          1,
        );
        await userEvent.click(
          root.querySelector<HTMLButtonElement>(
            ".mira-block-toolbar-trigger--active",
          )!,
        );
        await waitFor(() => expect(menu.getAttribute("hidden")).toBeNull());
      },
    );
  },
};
