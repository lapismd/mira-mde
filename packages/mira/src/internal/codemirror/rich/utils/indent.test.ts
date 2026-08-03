import { describe, expect, it } from "vitest";
import { EditorView } from "@codemirror/view";
import { createMarkdownCodeMirrorExtensions } from "../../markdown";
import {
  getIndentLineLayout,
  getLineIndentInfo,
  indentGuideDecorations,
  normalizeIndentText,
  selectionTouchesIndent,
  shouldRenderStyledUnorderedMarker,
  shouldAnchorPlainIndentToListItem,
  splitIndentSegments,
  toMarkdownColumns,
} from "./indent";

describe("indent helpers", () => {
  it("derives Lapis-style indentation metadata", () => {
    expect(toMarkdownColumns("\t  ")).toBe(6);
    expect(normalizeIndentText("\t  ")).toBe("      ");
    expect(splitIndentSegments("      ")).toEqual([
      { text: "    ", guide: true },
      { text: "  ", guide: false },
    ]);
    expect(getLineIndentInfo("    - nested")).toEqual({
      columns: 4,
      depth: 2,
      kind: "ul",
      text: "    ",
    });
    expect(getLineIndentInfo("  continuation")).toEqual({
      columns: 2,
      depth: 1,
      kind: "plain",
      text: "  ",
    });
    expect(selectionTouchesIndent(2, 2, 0, 4)).toBe(true);
    expect(selectionTouchesIndent(5, 5, 0, 4)).toBe(false);
    expect(shouldRenderStyledUnorderedMarker(true, 12, 10)).toBe(true);
    expect(shouldRenderStyledUnorderedMarker(false, 12, 10)).toBe(false);
    expect(shouldRenderStyledUnorderedMarker(true, 10, 10)).toBe(false);
    expect(shouldRenderStyledUnorderedMarker(true, 11, 10)).toBe(false);
    expect(shouldAnchorPlainIndentToListItem(2, 2)).toBe(true);
    expect(shouldAnchorPlainIndentToListItem(8, 3)).toBe(false);
  });

  it("styles inactive dash and asterisk markers only in live preview", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const view = new EditorView({
      doc: ["# List markers", "", "- Dash item", "* Asterisk item"].join("\n"),
      extensions: [
        createMarkdownCodeMirrorExtensions(),
        indentGuideDecorations({ livePreview: true }),
      ],
      parent,
    });
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    const markerFor = (snippet: string) =>
      [...parent.querySelectorAll<HTMLElement>(".cm-line")]
        .find((line) => (line.textContent || "").includes(snippet))
        ?.querySelector<HTMLElement>(".cm-formatting-list-ul");

    expect(markerFor("Dash item")?.textContent).toBe("- ");
    expect(markerFor("Dash item")?.classList).toContain(
      "cm-formatting-list-bullet",
    );
    expect(markerFor("Asterisk item")?.textContent).toBe("* ");
    expect(markerFor("Asterisk item")?.classList).toContain(
      "cm-formatting-list-bullet",
    );

    view.dispatch({ selection: { anchor: view.state.doc.line(3).from } });
    expect(markerFor("Dash item")?.classList).not.toContain(
      "cm-formatting-list-bullet",
    );
    expect(markerFor("Asterisk item")?.classList).toContain(
      "cm-formatting-list-bullet",
    );

    view.destroy();
    parent.remove();
  });

  it("derives authored prefixes for top-level, quoted, and plain lines", () => {
    expect(getIndentLineLayout("- wrapped item")).toMatchObject({
      fallbackColumns: 2,
      indentText: "",
      kind: "ul",
      listKind: "ul",
      markerFrom: 0,
      markerTo: 2,
    });
    expect(getIndentLineLayout("> 1. quoted item")).toMatchObject({
      fallbackColumns: 5,
      indentText: "",
      kind: "quote-list",
      listKind: "ol",
      quoteFrom: 0,
      quoteTo: 2,
    });
    expect(getIndentLineLayout("> quoted paragraph")).toMatchObject({
      fallbackColumns: 2,
      indentText: "",
      kind: "quote",
      quoteFrom: 0,
      quoteTo: 2,
    });
    expect(getIndentLineLayout("    > indented quote")).toMatchObject({
      fallbackColumns: 6,
      indentText: "    ",
      kind: "quote",
      quoteFrom: 4,
      quoteTo: 6,
    });
    expect(getIndentLineLayout("    continuation")).toMatchObject({
      fallbackColumns: 4,
      indentText: "    ",
      kind: "plain",
    });
  });

  it("does not apply hanging indent inside fenced code blocks", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const view = new EditorView({
      doc: [
        "~~~mermaid",
        "  Source --> LivePreview",
        "  LivePreview --> Preview",
        "~~~",
        "  outside continuation",
      ].join("\n"),
      extensions: indentGuideDecorations({ livePreview: false }),
      parent,
    });
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    const fenceBody = [...parent.querySelectorAll(".cm-line")].filter((line) =>
      (line.textContent || "").includes("Source --> LivePreview"),
    );
    expect(fenceBody.length).toBe(1);
    expect(fenceBody[0]?.classList.contains("indented-wrapped-line")).toBe(
      false,
    );
    expect(fenceBody[0]?.querySelector(".cm-hmd-list-indent")).toBeNull();

    const outside = [...parent.querySelectorAll(".cm-line")].find((line) =>
      (line.textContent || "").includes("outside continuation"),
    );
    expect(outside?.classList.contains("indented-wrapped-line")).toBe(true);

    view.destroy();
    parent.remove();
  });

  it("anchors list continuations through syntax-tree ownership", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const view = new EditorView({
      doc: [
        "- Bullet item",
        " This single-space continuation",
        "  This two-space continuation",
        "",
        "2. Multiple paragraphs:",
        "    First ordered continuation",
        "",
        "    Second ordered continuation",
        "",
        "4. Preformatted content:",
        "",
        "        Eight-space preformatted content",
      ].join("\n"),
      extensions: [
        createMarkdownCodeMirrorExtensions(),
        indentGuideDecorations({ livePreview: false }),
      ],
      parent,
    });
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    const lineContaining = (snippet: string) =>
      [...parent.querySelectorAll<HTMLElement>(".cm-line")].find((line) =>
        (line.textContent || "").includes(snippet),
      );
    const bullet = lineContaining("Bullet item");
    const ordered = lineContaining("Multiple paragraphs");
    const single = lineContaining("single-space continuation");
    const two = lineContaining("two-space continuation");
    const first = lineContaining("First ordered continuation");
    const second = lineContaining("Second ordered continuation");
    const preformatted = lineContaining("Eight-space preformatted content");

    expect(bullet?.dataset["indentAnchorLineFrom"]).toBeUndefined();
    expect(bullet?.classList.contains("cm-formatting-list-ul")).toBe(false);
    expect(bullet?.querySelector(".cm-formatting-list-ul")).not.toBeNull();
    expect(single?.dataset["indentAnchorLineFrom"]).toBe(
      `${view.state.doc.line(1).from}`,
    );
    expect(two?.dataset["indentAnchorLineFrom"]).toBe(
      `${view.state.doc.line(1).from}`,
    );
    expect(two?.getAttribute("style")).toContain(
      "--hmd-indent-widget-prefix-fallback: var(--list-indent)",
    );
    expect(two?.getAttribute("style")).toContain(
      "--hmd-indent-padding-fallback: 2ch",
    );
    expect(first?.dataset["indentAnchorLineFrom"]).toBe(
      `${view.state.doc.line(5).from}`,
    );
    expect(second?.dataset["indentAnchorLineFrom"]).toBe(
      `${view.state.doc.line(5).from}`,
    );
    expect(ordered?.classList.contains("cm-formatting-list-ol")).toBe(false);
    expect(preformatted?.dataset["indentAnchorLineFrom"]).toBeUndefined();
    expect(preformatted?.querySelectorAll(".cm-indent-guide")).toHaveLength(2);
    expect(preformatted?.getAttribute("style")).toContain(
      "--hmd-indent-widget-prefix-fallback: calc(var(--list-indent) + var(--list-indent))",
    );

    view.destroy();
    parent.remove();
  });
});
