import { history, undo } from "@codemirror/commands";
import { EditorView } from "@codemirror/view";
import { describe, expect, it, vi } from "vitest";
import { collectMarkdownBlockHandles } from "./block-ranges";
import {
  applyBlockToolbarItem,
  blockPresentation,
  canApplyBlockToolbarItem,
  defaultMiraBlockToolbarItems,
  resolveMiraBlockControlsOptions,
} from "./block-toolbar";

function editor(markdown: string): {
  view: EditorView;
  destroy: () => void;
} {
  const parent = document.createElement("div");
  document.body.append(parent);
  const view = new EditorView({
    doc: markdown,
    extensions: [history()],
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

function handleAt(view: EditorView, line: number) {
  return collectMarkdownBlockHandles(view.state).find(
    (handle) => handle.handleRange.startLine === line,
  )!;
}

describe("contextual block toolbar", () => {
  it("keeps the existing boolean contract and enables the toolbar explicitly", () => {
    expect(resolveMiraBlockControlsOptions(true)).toEqual({
      enabled: true,
      toolbar: null,
    });
    expect(
      resolveMiraBlockControlsOptions({ enabled: true, toolbar: true }),
    ).toEqual({
      enabled: true,
      toolbar: {
        ariaLabel: "Change block type",
        items: defaultMiraBlockToolbarItems,
      },
    });
    expect(
      resolveMiraBlockControlsOptions({
        toolbar: {
          ariaLabel: "Block style",
          items: ["paragraph", "paragraph"],
        },
      }),
    ).toEqual({
      enabled: true,
      toolbar: { ariaLabel: "Block style", items: ["paragraph"] },
    });
  });

  it("resolves semantic presentations for tasks, headings, paragraphs, and rich blocks", () => {
    const fixture = editor(`# Heading

Paragraph

- [?] Task

\`\`\`ts
code
\`\`\`
`);
    const handles = collectMarkdownBlockHandles(fixture.view.state);

    expect(blockPresentation(handles[0]!)).toMatchObject({
      icon: "heading1",
      label: "Heading 1",
      type: "heading1",
    });
    expect(blockPresentation(handles[1]!)).toMatchObject({
      icon: "paragraph",
      type: "paragraph",
    });
    expect(blockPresentation(handles[2]!)).toMatchObject({
      icon: "task",
      type: "task",
    });
    expect(blockPresentation(handles[3]!)).toMatchObject({
      icon: "code",
      type: null,
    });
    fixture.destroy();
  });

  it("converts structural prefixes without changing content", () => {
    const fixture = editor("Paragraph");
    const handle = handleAt(fixture.view, 1);

    expect(applyBlockToolbarItem(fixture.view, handle, "heading2")).toBe(true);
    expect(fixture.view.state.doc.toString()).toBe("## Paragraph");

    expect(
      applyBlockToolbarItem(fixture.view, handleAt(fixture.view, 1), "task"),
    ).toBe(true);
    expect(fixture.view.state.doc.toString()).toBe("- [ ] Paragraph");

    expect(
      applyBlockToolbarItem(
        fixture.view,
        handleAt(fixture.view, 1),
        "numberedList",
      ),
    ).toBe(true);
    expect(fixture.view.state.doc.toString()).toBe("1. Paragraph");
    fixture.destroy();
  });

  it.each([
    ["Paragraph", "heading1", "# Paragraph"],
    ["Paragraph", "heading3", "### Paragraph"],
    ["Paragraph", "bulletList", "- Paragraph"],
    ["Paragraph", "quote", "> Paragraph"],
    ["* Item", "paragraph", "Item"],
  ] as const)("converts %s to %s", (markdown, item, expected) => {
    const fixture = editor(markdown);
    expect(
      applyBlockToolbarItem(fixture.view, handleAt(fixture.view, 1), item),
    ).toBe(true);
    expect(fixture.view.state.doc.toString()).toBe(expected);
    fixture.destroy();
  });

  it("treats the current structural type as a no-op", () => {
    const fixture = editor("## Heading");
    expect(
      applyBlockToolbarItem(
        fixture.view,
        handleAt(fixture.view, 1),
        "heading2",
      ),
    ).toBe(false);
    expect(fixture.view.state.doc.toString()).toBe("## Heading");
    fixture.destroy();
  });

  it("preserves indentation and outer quote ancestry", () => {
    const fixture = editor("  > > - [x] Nested task");
    let handle = handleAt(fixture.view, 1);

    expect(applyBlockToolbarItem(fixture.view, handle, "heading3")).toBe(true);
    expect(fixture.view.state.doc.toString()).toBe("  > > ### Nested task");

    handle = handleAt(fixture.view, 1);
    expect(applyBlockToolbarItem(fixture.view, handle, "paragraph")).toBe(true);
    expect(fixture.view.state.doc.toString()).toBe("  > > Nested task");

    handle = handleAt(fixture.view, 1);
    expect(applyBlockToolbarItem(fixture.view, handle, "paragraph")).toBe(true);
    expect(fixture.view.state.doc.toString()).toBe("  > Nested task");
    fixture.destroy();
  });

  it("normalizes setext headings and compatible list markers", () => {
    const setext = editor("Title\n=====");
    expect(
      applyBlockToolbarItem(setext.view, handleAt(setext.view, 1), "heading3"),
    ).toBe(true);
    expect(setext.view.state.doc.toString()).toBe("### Title");
    setext.destroy();

    const list = editor("+ [!] Important");
    expect(
      applyBlockToolbarItem(list.view, handleAt(list.view, 1), "bulletList"),
    ).toBe(true);
    expect(list.view.state.doc.toString()).toBe("- Important");
    list.destroy();
  });

  it("disables structural conversion for rich blocks", () => {
    const fixture = editor("```ts\ncode\n```");
    const handle = handleAt(fixture.view, 1);

    expect(canApplyBlockToolbarItem(handle, "paragraph")).toBe(false);
    expect(applyBlockToolbarItem(fixture.view, handle, "paragraph")).toBe(
      false,
    );
    expect(fixture.view.state.doc.toString()).toBe("```ts\ncode\n```");
    fixture.destroy();
  });

  it("inserts a divider after a non-empty block", () => {
    const fixture = editor("Alpha\n\nBeta");

    expect(
      applyBlockToolbarItem(fixture.view, handleAt(fixture.view, 1), "divider"),
    ).toBe(true);
    expect(fixture.view.state.doc.toString()).toBe("Alpha\n\n---\n\nBeta");
    fixture.destroy();
  });

  it("targets a blank block boundary before invoking the image action", () => {
    const fixture = editor("Alpha\n\nBeta");
    const insertImage = vi.fn();

    expect(
      applyBlockToolbarItem(fixture.view, handleAt(fixture.view, 1), "image", {
        insertImage,
      }),
    ).toBe(true);
    expect(insertImage).toHaveBeenCalledOnce();
    expect(fixture.view.state.selection.main.head).toBe(6);
    expect(fixture.view.state.doc.toString()).toBe("Alpha\n\nBeta");
    fixture.destroy();
  });

  it("keeps conversions in one undo step", () => {
    const fixture = editor("Paragraph");
    applyBlockToolbarItem(fixture.view, handleAt(fixture.view, 1), "heading1");

    expect(fixture.view.state.doc.toString()).toBe("# Paragraph");
    expect(undo(fixture.view)).toBe(true);
    expect(fixture.view.state.doc.toString()).toBe("Paragraph");
    fixture.destroy();
  });

  it("preserves backward selection, focus, and scroll geometry", () => {
    const fixture = editor("Paragraph");
    fixture.view.dispatch({ selection: { anchor: 8, head: 2 } });
    fixture.view.scrollDOM.scrollTop = 12;
    fixture.view.scrollDOM.scrollLeft = 3;

    applyBlockToolbarItem(fixture.view, handleAt(fixture.view, 1), "heading1");

    expect(fixture.view.state.selection.main.anchor).toBe(10);
    expect(fixture.view.state.selection.main.head).toBe(4);
    expect(fixture.view.state.selection.main.anchor).toBeGreaterThan(
      fixture.view.state.selection.main.head,
    );
    expect(fixture.view.scrollDOM.scrollTop).toBe(12);
    expect(fixture.view.scrollDOM.scrollLeft).toBe(3);
    expect(fixture.view.hasFocus).toBe(true);
    fixture.destroy();
  });
});
