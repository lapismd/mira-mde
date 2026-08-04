import { EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import { getTaskMarkerRange, selectionTouchesTaskMarker } from "./tasks";

describe("task utilities", () => {
  it("resolves normal and custom task marker ranges", () => {
    expect(getTaskMarkerRange("- [ ] Open task", 0)).toEqual({
      markerStart: 0,
      checkboxStart: 2,
      checkboxEnd: 5,
      markerEnd: 6,
      taskValue: " ",
    });
    expect(getTaskMarkerRange("  * [/] Custom task", 10)).toEqual({
      markerStart: 12,
      checkboxStart: 14,
      checkboxEnd: 17,
      markerEnd: 18,
      taskValue: "/",
    });
    expect(getTaskMarkerRange("- [?] Question task", 0)?.taskValue).toBe("?");
    expect(getTaskMarkerRange("- [-] Cancelled task", 0)?.taskValue).toBe("-");
  });

  it("resolves task markers after authored blockquote prefixes", () => {
    expect(
      getTaskMarkerRange("  >   - [ ] Quoted checklist child", 20),
    ).toEqual({
      markerStart: 26,
      checkboxStart: 28,
      checkboxEnd: 31,
      markerEnd: 32,
      taskValue: " ",
    });
    expect(getTaskMarkerRange("> > 1. [x] Nested task", 0)).toEqual({
      markerStart: 4,
      checkboxStart: 7,
      checkboxEnd: 10,
      markerEnd: 11,
      taskValue: "x",
    });
  });

  it("treats the task marker prefix as active for source reveal", () => {
    for (let anchor = 0; anchor <= 6; anchor += 1) {
      const state = EditorState.create({
        doc: "* [/] Custom task\nParagraph",
        selection: { anchor },
      });
      const taskLine = state.doc.line(1);
      const taskRange = getTaskMarkerRange(taskLine.text, taskLine.from);

      expect(
        selectionTouchesTaskMarker(state, taskLine.from, taskRange!.markerEnd),
      ).toBe(true);
    }

    const state = EditorState.create({
      doc: "* [/] Custom task\nParagraph",
      selection: { anchor: 10 },
    });
    const taskLine = state.doc.line(1);
    const taskRange = getTaskMarkerRange(taskLine.text, taskLine.from);
    expect(
      selectionTouchesTaskMarker(state, taskLine.from, taskRange!.markerEnd),
    ).toBe(false);
  });
});
