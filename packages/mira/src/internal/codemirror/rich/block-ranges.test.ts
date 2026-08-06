import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { describe, expect, it } from "vitest";
import {
  collectMarkdownBlockHandles,
  collectMarkdownBlockRanges,
  deleteMarkdownBlockRange,
  duplicateMarkdownBlockRange,
  moveMarkdownBlockHandle,
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

  it("treats a seeded divider comment and rule as one logical block", () => {
    const blocks = collectMarkdownBlockRanges(
      state(`Alpha

<!-- mira-divider:v1:00000001 -->
---

Beta`),
    );

    expect(
      blocks.map(({ kind, startLine, endLine }) => ({
        kind,
        startLine,
        endLine,
      })),
    ).toEqual([
      { kind: "paragraph", startLine: 1, endLine: 1 },
      { kind: "thematic-break", startLine: 3, endLine: 4 },
      { kind: "paragraph", startLine: 6, endLine: 6 },
    ]);
    expect(blocks[1]?.text).toBe("<!-- mira-divider:v1:00000001 -->\n---");
  });
});

describe("collectMarkdownBlockHandles", () => {
  it("expands heading handles to their section subtree", () => {
    const handles = collectMarkdownBlockHandles(
      state(`# One

Intro

## Two

Nested

# Three

Tail
`),
    );

    const one = handles.find((handle) => handle.id === "line-1")!;
    const two = handles.find((handle) => handle.id === "line-5")!;

    expect(one.role).toBe("heading-section");
    expect(one.headingLevel).toBe(1);
    expect(one.affectedRange.text).toBe("# One\n\nIntro\n\n## Two\n\nNested");
    expect(two.role).toBe("heading-section");
    expect(two.headingLevel).toBe(2);
    expect(two.affectedRange.text).toBe("## Two\n\nNested");
  });

  it("expands setext heading handles by heading level", () => {
    const handles = collectMarkdownBlockHandles(
      state(`Title
=====

Intro

Next
----

Nested
`),
    );

    const title = handles.find((handle) => handle.id === "line-1")!;
    const next = handles.find((handle) => handle.id === "line-6")!;

    expect(title.headingLevel).toBe(1);
    expect(title.affectedRange.text).toBe(
      "Title\n=====\n\nIntro\n\nNext\n----\n\nNested\n",
    );
    expect(next.headingLevel).toBe(2);
    expect(next.affectedRange.text).toBe("Next\n----\n\nNested\n");
  });

  it("creates one handle for each list item with nested affected ranges", () => {
    const handles = collectMarkdownBlockHandles(
      state(`- parent
  continuation
  - child
    nested
- sibling
`),
    ).filter((handle) => handle.role === "list-item");

    expect(handles.map((handle) => handle.id)).toEqual([
      "list-item-1",
      "list-item-3",
      "list-item-5",
    ]);
    expect(handles[0]?.affectedRange.text).toBe(
      "- parent\n  continuation\n  - child\n    nested",
    );
    expect(handles[1]?.parentId).toBe("list-item-1");
    expect(handles[1]?.affectedRange.text).toBe("  - child\n    nested");
    expect(handles[2]?.listIndent).toBe(0);
  });

  it("records bullet, ordered, and custom task list semantics", () => {
    const handles = collectMarkdownBlockHandles(
      state(`- bullet
1. ordered
* [?] custom task
`),
    ).filter((handle) => handle.role === "list-item");

    expect(
      handles.map(({ listKind, taskMarker }) => ({ listKind, taskMarker })),
    ).toEqual([
      { listKind: "bullet", taskMarker: undefined },
      { listKind: "numbered", taskMarker: undefined },
      { listKind: "task", taskMarker: "?" },
    ]);
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

  it("moves and deletes a seeded divider as one authored pair", () => {
    const editor = createView(`Alpha

<!-- mira-divider:v1:00000001 -->
---

Beta
`);
    let blocks = collectMarkdownBlockRanges(editor.view.state);
    const divider = blocks.find((block) => block.kind === "thematic-break")!;
    const beta = blocks.find((block) => block.text === "Beta")!;

    expect(
      moveMarkdownBlockRange(editor.view, divider, {
        block: beta,
        position: "after",
      }),
    ).toBe(true);
    expect(editor.view.state.doc.toString()).toBe(`Alpha

Beta

<!-- mira-divider:v1:00000001 -->
---
`);

    blocks = collectMarkdownBlockRanges(editor.view.state);
    deleteMarkdownBlockRange(
      editor.view,
      blocks.find((block) => block.kind === "thematic-break")!,
    );
    expect(editor.view.state.doc.toString()).toBe("Alpha\n\nBeta\n\n");
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

  it("moves heading handles as whole sections", () => {
    const editor = createView(`# One

Intro

## Two

Nested

# Three
`);
    const handles = collectMarkdownBlockHandles(editor.view.state);
    const one = handles.find((handle) => handle.id === "line-1")!;
    const three = handles.find((handle) => handle.id === "line-9")!;

    expect(
      moveMarkdownBlockHandle(editor.view, one, {
        handle: three,
        position: "after",
      }),
    ).toBe(true);
    expect(editor.view.state.doc.toString()).toBe(`# Three

# One

Intro

## Two

Nested
`);
    editor.destroy();
  });

  it("moves list item subtrees before and after siblings without blank separators", () => {
    const editor = createView("- one\n- two\n  - child\n- three\n");
    const handles = collectMarkdownBlockHandles(editor.view.state);
    const two = handles.find((handle) => handle.id === "list-item-2")!;
    const one = handles.find((handle) => handle.id === "list-item-1")!;

    expect(
      moveMarkdownBlockHandle(editor.view, two, {
        handle: one,
        position: "before",
      }),
    ).toBe(true);
    expect(editor.view.state.doc.toString()).toBe(
      "- two\n  - child\n- one\n- three\n",
    );
    editor.destroy();
  });

  it("moves list items inside other list items and normalizes indentation", () => {
    const editor = createView("- parent\n- child\n");
    const handles = collectMarkdownBlockHandles(editor.view.state);
    const child = handles.find((handle) => handle.id === "list-item-2")!;
    const parent = handles.find((handle) => handle.id === "list-item-1")!;

    expect(
      moveMarkdownBlockHandle(editor.view, child, {
        handle: parent,
        position: "inside",
      }),
    ).toBe(true);
    expect(editor.view.state.doc.toString()).toBe("- parent\n  - child\n");
    editor.destroy();
  });

  it("normalizes nested list items to top-level when moved outside lists", () => {
    const editor = createView("Intro\n\n- parent\n  - child\n\nOutro\n");
    const handles = collectMarkdownBlockHandles(editor.view.state);
    const child = handles.find((handle) => handle.id === "list-item-4")!;
    const outro = handles.find((handle) => handle.id === "line-6")!;

    expect(
      moveMarkdownBlockHandle(editor.view, child, {
        handle: outro,
        position: "before",
      }),
    ).toBe(true);
    expect(editor.view.state.doc.toString()).toBe(
      "Intro\n\n- parent\n\n- child\n\nOutro\n",
    );
    editor.destroy();
  });

  it("rejects moving a handle into its own affected range", () => {
    const editor = createView("- parent\n  - child\n- sibling\n");
    const handles = collectMarkdownBlockHandles(editor.view.state);
    const parent = handles.find((handle) => handle.id === "list-item-1")!;
    const child = handles.find((handle) => handle.id === "list-item-2")!;

    expect(
      moveMarkdownBlockHandle(editor.view, parent, {
        handle: child,
        position: "inside",
      }),
    ).toBe(false);
    expect(editor.view.state.doc.toString()).toBe(
      "- parent\n  - child\n- sibling\n",
    );
    editor.destroy();
  });
});
