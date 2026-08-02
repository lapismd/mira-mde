import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { fromOffset, toOffset } from ".";

describe("position conversion", () => {
  it("round trips offsets and editor positions", () => {
    const state = EditorState.create({ doc: "one\ntwo" });
    const position = fromOffset(state.doc, 5);

    expect(position).toEqual({ line: 1, ch: 1 });
    expect(toOffset(state.doc, position)).toBe(5);
  });
});
