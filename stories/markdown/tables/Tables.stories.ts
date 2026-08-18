import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import { catalogParameters } from "../../catalog/catalog.mjs";
import EditorModeStory from "../_shared/EditorModeStory.svelte";
import MarkdownPreviewStory from "../_shared/MarkdownPreviewStory.svelte";
import {
  markdownEditorDocsSource,
  markdownPreviewDocsSource,
} from "../_shared/docs-source";
import { tablesMarkdown, wrappingTablesMarkdown } from "../fixtures";

const meta = {
  title: "Markdown/Tables",
  component: MarkdownPreviewStory,
  args: {
    value: tablesMarkdown,
  },
  parameters: {
    ...catalogParameters("tables"),
    docs: {
      description: {
        component:
          "Pipe tables support alignment markers and shared preview styling.",
      },
      source: {
        language: "html",
        type: "code",
        code: markdownPreviewDocsSource("tablesMarkdown"),
      },
    },
  },
} satisfies Meta<typeof MarkdownPreviewStory>;

export default meta;
type Story = StoryObj<typeof meta>;

async function expectRawTableTypography(
  canvasElement: HTMLElement,
): Promise<void> {
  const tableLines = Array.from(
    canvasElement.querySelectorAll<HTMLElement>(".cm-line.cm-table"),
  );
  const proseLine = Array.from(
    canvasElement.querySelectorAll<HTMLElement>(".cm-line"),
  ).find((line) =>
    line.textContent?.includes(
      "Pipe tables support alignment markers and shared preview",
    ),
  );

  await expect(tableLines).toHaveLength(5);
  await expect(proseLine).toBeDefined();

  const tableStyle = getComputedStyle(tableLines[0]!);
  const proseStyle = getComputedStyle(proseLine!);
  const ownerDocument = canvasElement.ownerDocument;
  const monoProbe = ownerDocument.createElement("span");
  monoProbe.style.fontFamily = "var(--font-monospace)";
  monoProbe.style.position = "absolute";
  monoProbe.style.visibility = "hidden";
  tableLines[0]!.append(monoProbe);
  const monoFontFamily = getComputedStyle(monoProbe).fontFamily;
  monoProbe.remove();

  await expect(tableLines[0]!.classList).toContain("cm-formatting-table");
  await expect(tableStyle.fontFamily).toBe(monoFontFamily);
  await expect(tableStyle.whiteSpace).toBe("pre");
  await expect(proseStyle.fontFamily).not.toBe(monoFontFamily);

  const pipeOffsets = tableLines.map((line) => {
    const lineLeft = line.getBoundingClientRect().left;
    const walker = ownerDocument.createTreeWalker(
      line,
      ownerDocument.defaultView?.NodeFilter.SHOW_TEXT ?? 4,
    );
    const offsets: number[] = [];
    let node = walker.nextNode();

    while (node) {
      const text = node.textContent ?? "";
      for (let index = 0; index < text.length; index += 1) {
        if (text[index] !== "|") continue;
        const range = ownerDocument.createRange();
        range.setStart(node, index);
        range.setEnd(node, index + 1);
        offsets.push(range.getBoundingClientRect().left - lineLeft);
      }
      node = walker.nextNode();
    }

    return offsets;
  });

  for (const offsets of pipeOffsets) {
    await expect(offsets).toHaveLength(4);
    offsets.forEach((offset, index) => {
      expect(Math.abs(offset - pipeOffsets[0]![index]!)).toBeLessThanOrEqual(
        0.5,
      );
    });
  }
}

async function expectWrappedTableWidget(
  canvasElement: HTMLElement,
  longCellText = "100",
): Promise<void> {
  const shell = canvasElement.querySelector<HTMLElement>(
    ".mira-table-widget-shell",
  );
  await expect(shell).not.toBeNull();
  await expect(["visible", "hidden"]).toContain(
    getComputedStyle(shell!).overflowX,
  );

  const cell = Array.from(
    canvasElement.querySelectorAll<HTMLElement>(".table-cell-wrapper"),
  ).find((element) => element.textContent?.includes(longCellText));
  await expect(cell).toBeDefined();

  const tableCell = cell!.closest("td, th");
  await expect(tableCell).not.toBeNull();
  await expect(getComputedStyle(tableCell!).whiteSpace).toBe("break-spaces");

  const scroller = cell!.querySelector<HTMLElement>(".cm-scroller");
  await expect(scroller).not.toBeNull();
  await expect(["hidden", "clip"]).toContain(
    getComputedStyle(scroller!).overflowX,
  );
  await expect(scroller!.scrollWidth).toBeLessThanOrEqual(
    scroller!.clientWidth + 1,
  );
}

async function expectScrollableSourceTableLines(
  canvasElement: HTMLElement,
): Promise<void> {
  const content = canvasElement.querySelector<HTMLElement>(
    ".cm-editor.markdown-source-view > .cm-scroller > .cm-content, .cm-editor.markdown-live-preview-mode > .cm-scroller > .cm-content",
  );
  const tableLine =
    canvasElement.querySelector<HTMLElement>(".cm-line.cm-table");
  await expect(content).not.toBeNull();
  await expect(tableLine).not.toBeNull();
  await expect(["visible", "hidden"]).toContain(
    getComputedStyle(content!).overflowX,
  );
  await expect(getComputedStyle(tableLine!).overflowX).toBe("auto");
  await expect(getComputedStyle(tableLine!).scrollbarWidth).toBe("none");
  await expect(getComputedStyle(tableLine!).whiteSpace).toBe("pre");
  await expect(tableLine!.scrollWidth).toBeGreaterThan(tableLine!.clientWidth);

  const contentScrollLeft = content!.scrollLeft;
  tableLine!.scrollLeft = 40;
  await expect(tableLine!.scrollLeft).toBeGreaterThan(0);
  await expect(content!.scrollLeft).toBe(contentScrollLeft);
}

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
        "/visual-baselines/stories/markdown/tables/preview-chromium.png",
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
        "/visual-baselines/stories/markdown/tables/live-preview-chromium.png",
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
        code: markdownEditorDocsSource("tablesMarkdown", "live-preview"),
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectWrappedTableWidget(canvasElement);
    const sourceToggle = await canvas.findByRole("button", {
      name: "Edit table source",
    });
    await userEvent.click(sourceToggle);
    await expect(
      canvas.queryByRole("button", { name: "Edit table source" }),
    ).not.toBeInTheDocument();
    const editor = canvasElement.querySelector<HTMLElement>(".cm-content");
    await expect(editor).toHaveTextContent("Package");
    await expect(editor).toHaveTextContent("Surface");
    await expect(editor).toHaveTextContent("Status");
    await expectRawTableTypography(canvasElement);
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
        "/visual-baselines/stories/markdown/tables/source-mode-chromium.png",
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
        code: markdownEditorDocsSource("tablesMarkdown", "source"),
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expectRawTableTypography(canvasElement);
  },
};

export const SourceModeOverflow: Story = {
  tags: [
    "visual-pending",
    "!visual-approved",
    "!visual-ready",
    "!visual-failed",
  ],
  name: "Source Mode Overflow",
  args: {
    value: wrappingTablesMarkdown,
  },
  render: (args) => ({
    Component: EditorModeStory,
    props: {
      ...args,
      mode: "source",
      width: "22rem",
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          "Long source-mode table rows scroll horizontally without visible scrollbar chrome.",
      },
      source: {
        language: "html",
        type: "code",
        code: markdownEditorDocsSource("wrappingTablesMarkdown", "source"),
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expectScrollableSourceTableLines(canvasElement);
  },
};

export const LivePreviewWrapping: Story = {
  tags: [
    "visual-pending",
    "!visual-approved",
    "!visual-ready",
    "!visual-failed",
  ],
  name: "Live Preview Wrapping",
  args: {
    value: wrappingTablesMarkdown,
  },
  render: (args) => ({
    Component: EditorModeStory,
    props: {
      ...args,
      mode: "live-preview",
      width: "22rem",
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          "Rendered live-preview table cells wrap their text instead of scrolling.",
      },
      source: {
        language: "html",
        type: "code",
        code: markdownEditorDocsSource(
          "wrappingTablesMarkdown",
          "live-preview",
        ),
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expectWrappedTableWidget(
      canvasElement,
      "Browser automation: navigate, click, snapshot",
    );
    const longCell = Array.from(
      canvasElement.querySelectorAll<HTMLElement>(".table-cell-wrapper"),
    ).find((element) =>
      element.textContent?.includes(
        "Browser automation: navigate, click, snapshot",
      ),
    );
    await expect(longCell).toBeDefined();
    await expect(longCell!.getBoundingClientRect().height).toBeGreaterThan(28);
  },
};
