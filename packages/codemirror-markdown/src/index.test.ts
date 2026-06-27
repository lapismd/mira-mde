import { describe, expect, it } from "vitest";
import { createMarkdownCodeMirrorExtensions } from ".";

describe("createMarkdownCodeMirrorExtensions", () => {
  it("returns markdown language and decoration extensions", () => {
    expect(createMarkdownCodeMirrorExtensions()).toHaveLength(3);
  });
});
