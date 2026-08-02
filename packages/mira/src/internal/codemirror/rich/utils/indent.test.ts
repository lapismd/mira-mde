import { describe, expect, it } from "vitest";
import { EditorView } from "@codemirror/view";
import {
  getIndentLineLayout,
  getLineIndentInfo,
  indentGuideDecorations,
  normalizeIndentText,
  selectionTouchesIndent,
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
});
