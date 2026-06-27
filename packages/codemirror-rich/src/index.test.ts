import { describe, expect, it } from "vitest";
import { createRichEditorExtensions } from ".";

describe("createRichEditorExtensions", () => {
  it("can be disabled", () => {
    expect(createRichEditorExtensions({ enabled: false })).toEqual([]);
  });
});
