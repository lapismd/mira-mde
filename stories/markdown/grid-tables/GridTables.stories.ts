import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect } from "storybook/test";
import { catalogParameters } from "../../catalog/catalog.mjs";
import EditorModeStory from "../_shared/EditorModeStory.svelte";
import MarkdownPreviewStory from "../_shared/MarkdownPreviewStory.svelte";
import {
  markdownEditorDocsSource,
  markdownPreviewDocsSource,
} from "../_shared/docs-source";
import { gridTablesMarkdown } from "../fixtures";

const meta = {
  title: "Markdown/Grid Tables",
  component: MarkdownPreviewStory,
  args: {
    value: gridTablesMarkdown,
  },
  parameters: {
    ...catalogParameters("tables"),
    docs: {
      description: {
        component:
          "Grid tables use explicit boundaries for spans, sections, and alignment.",
      },
      source: {
        language: "html",
        type: "code",
        code: markdownPreviewDocsSource("gridTablesMarkdown"),
      },
    },
  },
} satisfies Meta<typeof MarkdownPreviewStory>;

export default meta;
type Story = StoryObj<typeof meta>;

async function expectGridTableTypography(
  canvasElement: HTMLElement,
): Promise<void> {
  const tableLines = Array.from(
    canvasElement.querySelectorAll<HTMLElement>(
      ".cm-line.cm-formatting-grid-table",
    ),
  );

  await expect(tableLines).toHaveLength(19);
  const monoProbe = canvasElement.ownerDocument.createElement("span");
  monoProbe.style.fontFamily = "var(--font-monospace)";
  monoProbe.style.position = "absolute";
  monoProbe.style.visibility = "hidden";
  tableLines[0]!.append(monoProbe);
  const monoFontFamily = getComputedStyle(monoProbe).fontFamily;
  monoProbe.remove();

  await expect(tableLines[0]!.classList).toContain("cm-table");
  await expect(getComputedStyle(tableLines[0]!).fontFamily).toBe(
    monoFontFamily,
  );
  await expect(getComputedStyle(tableLines[0]!).whiteSpace).toBe("pre");
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
        "/visual-baselines/stories/markdown/grid-tables/preview-chromium.png",
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
        "/visual-baselines/stories/markdown/grid-tables/live-preview-chromium.png",
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
        code: markdownEditorDocsSource("gridTablesMarkdown", "live-preview"),
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
      exposeValue: true,
      mode: "source",
    },
  }),
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/grid-tables/source-mode-chromium.png",
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
        code: markdownEditorDocsSource("gridTablesMarkdown", "source"),
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expectGridTableTypography(canvasElement);
  },
};
