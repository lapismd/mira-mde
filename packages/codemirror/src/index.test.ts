import { describe, expect, it } from "vitest";
import { createBaseCodeMirrorExtensions } from ".";

describe("createBaseCodeMirrorExtensions", () => {
  it("returns a non-empty extension set", () => {
    expect(createBaseCodeMirrorExtensions()).not.toHaveLength(0);
  });
});
