import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  markdownEditorDocsSource,
  markdownPreviewDocsSource,
} from "../_shared/docs-source";
import IndentationStory from "./IndentationStory.svelte";
import {
  activePrefixesMarkdown,
  configurableIndentWidthMarkdown,
  continuationParagraphsMarkdown,
  nestedListsAndQuotesLiveMarkdown,
  nestedListsAndQuotesMarkdown,
  wrappedListItemsMarkdown,
} from "./fixtures";

const meta = {
  title: "Markdown/Indentation",
  component: IndentationStory,
  tags: ["visual-pending"],
  args: {
    value: wrappedListItemsMarkdown,
    mode: "source",
    width: "36rem",
    height: "30rem",
    indentGuides: true,
    indentWithTabs: true,
    indentWidth: 4,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Focused Lapis-parity fixtures keep list wrapping, continuation indentation, nested blockquotes, raw-prefix editing, and indent-width behavior visible without scrolling the editor.",
      },
    },
  },
} satisfies Meta<typeof IndentationStory>;

export default meta;
type Story = StoryObj<typeof meta>;

function findVisibleTarget(
  root: HTMLElement,
  snippet: string,
): HTMLElement | null {
  const selectors = [
    ".cm-line",
    ".markdown-rendered li",
    ".markdown-rendered blockquote",
    ".markdown-rendered p",
    ".markdown-rendered pre",
  ].join(", ");
  return (
    Array.from(root.querySelectorAll<HTMLElement>(selectors)).find((element) =>
      element.textContent?.includes(snippet),
    ) ?? null
  );
}

async function expectTargetsVisible(
  canvasElement: HTMLElement,
  snippets: readonly string[],
): Promise<void> {
  await waitFor(() => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      ".cm-scroller, .mira-markdown-preview",
    );
    expect(viewport).not.toBeNull();
    if (!viewport) return;

    const viewportRect = viewport.getBoundingClientRect();
    for (const snippet of snippets) {
      const target = findVisibleTarget(canvasElement, snippet);
      expect(target, `Missing indentation target: ${snippet}`).not.toBeNull();
      if (!target) continue;
      const targetRect = target.getBoundingClientRect();
      expect(targetRect.top).toBeGreaterThanOrEqual(viewportRect.top - 1);
      expect(targetRect.bottom).toBeLessThanOrEqual(viewportRect.bottom + 1);
    }
  });
}

const wrappedTargets = [
  "1000. Navigate",
  "Keep this unordered item",
  "Keep this asterisk-authored item",
];
const continuationTargets = [
  "This single-space continuation",
  "This blank-separated continuation",
  "Eight-space preformatted content",
];
const nestedCoreTargets = [
  "Space-authored ordered grandchild",
  "Quoted checklist child",
];
const nestedTargets = [
  ...nestedCoreTargets,
  "rendered blockquote stays attached",
];
const activeTargets = [
  "Wrapped continuation stays aligned",
  "Blockquote content stays aligned",
  "Nested quoted line keeps the rendered block attached",
];

export const WrappedListItemsSource: Story = {
  tags: ["visual-ready"],
  name: "Wrapped List Items — Source",
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/indentation/wrapped-list-items-source-chromium.png",
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
        code: markdownEditorDocsSource("wrappedListItemsMarkdown", "source"),
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expectTargetsVisible(canvasElement, wrappedTargets);
  },
};

export const WrappedListItemsLivePreview: Story = {
  tags: ["visual-ready"],
  name: "Wrapped List Items — Live Preview",
  args: { mode: "live-preview" },
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/indentation/wrapped-list-items-live-preview-chromium.png",
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
        code: markdownEditorDocsSource(
          "wrappedListItemsMarkdown",
          "live-preview",
        ),
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expectTargetsVisible(canvasElement, wrappedTargets);
  },
};

export const ContinuationParagraphsSource: Story = {
  tags: ["visual-ready"],
  name: "Continuation Paragraphs — Source",
  args: {
    value: continuationParagraphsMarkdown,
    mode: "source",
    height: "40rem",
    initialSelection: {
      anchor: { line: 0, ch: 0 },
      head: { line: 0, ch: 0 },
    },
  },
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/indentation/continuation-paragraphs-source-chromium.png",
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
        code: markdownEditorDocsSource(
          "continuationParagraphsMarkdown",
          "source",
        ),
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expectTargetsVisible(canvasElement, continuationTargets);
  },
};

export const ContinuationParagraphsLivePreview: Story = {
  tags: ["visual-ready"],
  name: "Continuation Paragraphs — Live Preview",
  args: {
    value: continuationParagraphsMarkdown,
    mode: "live-preview",
    height: "40rem",
    initialSelection: {
      anchor: { line: 0, ch: 0 },
      head: { line: 0, ch: 0 },
    },
  },
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/indentation/continuation-paragraphs-live-preview-chromium.png",
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
        code: markdownEditorDocsSource(
          "continuationParagraphsMarkdown",
          "live-preview",
        ),
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expectTargetsVisible(canvasElement, continuationTargets);
  },
};

export const NestedListsAndQuotesSource: Story = {
  tags: ["visual-ready"],
  name: "Nested Lists and Quotes — Source",
  args: {
    value: nestedListsAndQuotesMarkdown,
    mode: "source",
    height: "40rem",
  },
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/indentation/nested-lists-and-quotes-source-chromium.png",
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
        code: markdownEditorDocsSource(
          "nestedListsAndQuotesMarkdown",
          "source",
        ),
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expectTargetsVisible(canvasElement, nestedTargets);
  },
};

export const NestedListsAndQuotesLivePreview: Story = {
  tags: ["visual-ready"],
  name: "Nested Lists and Quotes — Live Preview",
  args: {
    value: nestedListsAndQuotesLiveMarkdown,
    mode: "live-preview",
    height: "40rem",
  },
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/indentation/nested-lists-and-quotes-live-preview-chromium.png",
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
        code: markdownEditorDocsSource(
          "nestedListsAndQuotesLiveMarkdown",
          "live-preview",
        ),
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expectTargetsVisible(canvasElement, nestedCoreTargets);
  },
};

export const NestedListsAndQuotesReading: Story = {
  tags: ["visual-ready"],
  name: "Nested Lists and Quotes — Reading",
  args: {
    value: nestedListsAndQuotesMarkdown,
    mode: "preview",
    height: "40rem",
  },
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/indentation/nested-lists-and-quotes-reading-chromium.png",
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
        code: markdownPreviewDocsSource("nestedListsAndQuotesMarkdown"),
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expectTargetsVisible(canvasElement, nestedTargets);
  },
};

export const ActivePrefixesSource: Story = {
  tags: ["visual-ready"],
  name: "Active Prefixes — Source",
  args: {
    value: activePrefixesMarkdown,
    mode: "source",
    height: "30rem",
    initialSelection: {
      anchor: { line: 3, ch: 1 },
      head: { line: 3, ch: 1 },
    },
  },
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/indentation/active-prefixes-source-chromium.png",
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
        code: markdownEditorDocsSource("activePrefixesMarkdown", "source"),
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expectTargetsVisible(canvasElement, activeTargets);
  },
};

export const ActivePrefixesLivePreview: Story = {
  tags: ["visual-ready"],
  name: "Active Prefixes — Live Preview",
  args: {
    value: activePrefixesMarkdown,
    mode: "live-preview",
    height: "40rem",
    initialSelection: {
      anchor: { line: 3, ch: 1 },
      head: { line: 3, ch: 1 },
    },
  },
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/indentation/active-prefixes-live-preview-chromium.png",
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
        code: markdownEditorDocsSource(
          "activePrefixesMarkdown",
          "live-preview",
        ),
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expectTargetsVisible(canvasElement, activeTargets);
  },
};

export const ConfigurableIndentWidth: Story = {
  tags: ["visual-ready"],
  name: "Configurable Indent Width",
  args: {
    value: configurableIndentWidthMarkdown,
    mode: "source",
    height: "24rem",
    indentWidth: 4,
  },
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/indentation/configurable-indent-width-chromium.png",
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
        code: `<MiraEditor
  bind:value
  mode="source"
  indentGuides
  indentWithTabs
  indentWidth={4}
/>`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const content = canvasElement.querySelector<HTMLElement>(".cm-content");
    if (!content) throw new Error("Indent-width editor did not render");
    expect(getComputedStyle(content).tabSize).toBe("4");

    await userEvent.click(canvas.getByRole("button", { name: "View options" }));
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByText("8 spaces", { selector: "span" }));

    await waitFor(() => {
      expect(getComputedStyle(content).tabSize).toBe("8");
    });
    await expectTargetsVisible(canvasElement, ["Double-tab grandchild"]);
  },
};
