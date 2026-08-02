import { describe, expect, it } from "vitest";
import { getFoldAnchor } from "./fold-indicators";

describe("fold indicators", () => {
  it("anchors fold indicators at the first content character", () => {
    expect(getFoldAnchor({ from: 10, text: "  ## Heading" })).toBe(12);
    expect(getFoldAnchor({ from: 10, text: "## Heading" })).toBe(10);
  });
});
