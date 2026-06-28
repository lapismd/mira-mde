import { describe, expect, it } from "vitest";
import { estimateMarkdownBlockHeight } from "./height-estimates";

describe("height estimates", () => {
  it("uses a Mermaid minimum height estimate", () => {
    expect(estimateMarkdownBlockHeight("```mermaid\ngraph TD\n```")).toBe(200);
  });

  it("keeps live table height estimates close to the row count", () => {
    expect(estimateMarkdownBlockHeight("| A |\n| --- |\n| x |")).toBe(96);
  });
});
