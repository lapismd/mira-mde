import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { describe, expect, it } from "vitest";
import {
  collectMarkdownBlockRanges,
  deleteMarkdownBlockRange,
  duplicateMarkdownBlockRange,
  moveMarkdownBlockRange,
} from "./block-ranges";

function state(markdown: string): EditorState {
  return EditorState.create({ doc: markdown });
}

function createView(markdown: string): {
  view: EditorView;
  destroy: () => void;
} {
  const parent = document.createElement("div");
  document.body.append(parent);
  const view = new EditorView({
    doc: markdown,
    parent,
  });

  return {
    view,
    destroy() {
      view.destroy();
      parent.remove();
    },
  };
}

describe("collectMarkdownBlockRanges", () => {
  it("collects Markdown-first block ranges across Mira block types", () => {
    const blocks = collectMarkdownBlockRanges(
      state(`---
title: Demo
---

# Heading

Paragraph one
continued.

> [!note]
> Callout body

- item
  - child
    continuation

\`\`\`mermaid
graph TD;
\`\`\`

| A | B |
| --- | --- |
| 1 | 2 |

+---+---+
| A | B |
+===+===+
| C | D |
+---+---+

![[image.png]]

$$
x=1
$$

<div>
html
</div>

---

:::note
directive
:::
`),
    );

    expect(blocks.map((block) => block.kind)).toEqual([
      "frontmatter",
      "heading",
      "paragraph",
      "blockquote",
      "list",
      "code",
      "table",
      "grid-table",
      "embed",
      "math",
      "html",
      "thematic-break",
      "directive",
    ]);
    expect(blocks.find((block) => block.kind === "list")?.text).toContain(
      "continuation",
    );
    expect(blocks.find((block) => block.kind === "directive")?.text).toBe(
      ":::note\ndirective\n:::",
    );
  });
});

describe("Markdown block mutations", () => {
  it("moves blocks while preserving blank-line separation", () => {
    const editor = createView("# One\n\nAlpha\n\nBeta\n");
    const blocks = collectMarkdownBlockRanges(editor.view.state);
    const alpha = blocks.find((block) => block.text === "Alpha")!;
    const beta = blocks.find((block) => block.text === "Beta")!;

    expect(
      moveMarkdownBlockRange(editor.view, beta, {
        block: alpha,
        position: "before",
      }),
    ).toBe(true);
    expect(editor.view.state.doc.toString()).toBe("# One\n\nBeta\n\nAlpha\n");
    editor.destroy();
  });

  it("duplicates blocks with normalized surrounding newlines", () => {
    const editor = createView("Alpha\n\nBeta\n");
    const [alpha] = collectMarkdownBlockRanges(editor.view.state);

    duplicateMarkdownBlockRange(editor.view, alpha!);

    expect(editor.view.state.doc.toString()).toBe("Alpha\n\nAlpha\n\nBeta\n");
    editor.destroy();
  });

  it("deletes blocks without leaving extra blank lines", () => {
    const editor = createView("Alpha\n\nBeta\n\nGamma\n");
    const beta = collectMarkdownBlockRanges(editor.view.state).find(
      (block) => block.text === "Beta",
    )!;

    deleteMarkdownBlockRange(editor.view, beta);

    expect(editor.view.state.doc.toString()).toBe("Alpha\n\nGamma\n");
    editor.destroy();
  });
});
