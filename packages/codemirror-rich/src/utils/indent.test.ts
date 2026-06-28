import { describe, expect, it } from "vitest";
import {
  getLineIndentInfo,
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
});
