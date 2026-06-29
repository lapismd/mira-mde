import { EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import { hasRenderedInitialFrontmatterCursor } from "./ranges";

describe("range utilities", () => {
  it("detects the hidden live-preview cursor state at rendered frontmatter start", () => {
    const state = EditorState.create({
      doc: "---\ntitle: Demo\n---\n# Heading",
      selection: { anchor: 0 },
    });

    expect(hasRenderedInitialFrontmatterCursor(state)).toBe(true);
  });

  it("does not hide the cursor for normal document starts or frontmatter source edits", () => {
    expect(
      hasRenderedInitialFrontmatterCursor(
        EditorState.create({
          doc: "# Heading",
          selection: { anchor: 0 },
        }),
      ),
    ).toBe(false);

    expect(
      hasRenderedInitialFrontmatterCursor(
        EditorState.create({
          doc: "---\ntitle: Demo\n---\n# Heading",
          selection: { anchor: 5 },
        }),
      ),
    ).toBe(false);
  });
});
