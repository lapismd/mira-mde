import { EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import { getAtxHeadingMarkerRange, selectionTouchesLine } from "./headings";

describe("heading utilities", () => {
  it("resolves ATX heading marker ranges including trailing marker space", () => {
    expect(getAtxHeadingMarkerRange("### Heading", 5)).toEqual({
      from: 5,
      to: 9,
    });
    expect(getAtxHeadingMarkerRange("#  Spaced", 0)).toEqual({
      from: 0,
      to: 3,
    });
    expect(getAtxHeadingMarkerRange("Not a heading", 0)).toBeNull();
    expect(getAtxHeadingMarkerRange("###NoSpace", 0)).toBeNull();
  });

  it("treats the whole heading line as active for syntax reveal", () => {
    const state = EditorState.create({
      doc: "# Heading\nParagraph",
      selection: { anchor: 4 },
    });
    const headingLine = state.doc.line(1);
    const paragraphLine = state.doc.line(2);

    expect(selectionTouchesLine(state, headingLine.from, headingLine.to)).toBe(
      true,
    );
    expect(
      selectionTouchesLine(state, paragraphLine.from, paragraphLine.to),
    ).toBe(false);
  });
});
