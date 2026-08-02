import { describe, expect, it } from "vitest";
import { findInlineMathRanges } from "./inline-math";

describe("inline math helpers", () => {
  it("finds inline math ranges while avoiding code and block math", () => {
    expect(findInlineMathRanges("Math $E = mc^2$ works")).toEqual([
      { from: 5, to: 15, source: "$E = mc^2$" },
    ]);
    expect(findInlineMathRanges("Cost is $5 and code `$x$`")).toEqual([]);
    expect(findInlineMathRanges("Block $$x = y$$ stays source")).toEqual([]);
    expect(findInlineMathRanges("Escaped \\$x$ stays source")).toEqual([]);
  });

  it("does not treat block math as inline math", () => {
    expect(findInlineMathRanges("$$\nx = y\n$$")).toEqual([]);
  });
});
