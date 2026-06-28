import { describe, expect, it } from "vitest";
import {
  createRichEditorExtensions,
  estimateMarkdownBlockHeight,
  findInlineMathRanges,
  getFencedCodeLanguage,
  getFencedCodeWidgetRange,
  getFoldAnchor,
} from ".";

describe("createRichEditorExtensions", () => {
  it("can be disabled", () => {
    expect(createRichEditorExtensions({ enabled: false })).toEqual([]);
  });

  it("detects fenced code language and replacement range", () => {
    const markdown = "```mermaid\ngraph TD\n  A --> B\n```\n";

    expect(getFencedCodeLanguage(markdown)).toBe("mermaid");
    expect(getFencedCodeWidgetRange(markdown)).toEqual({
      from: 0,
      to: markdown.trimEnd().length,
    });
  });

  it("uses a Mermaid minimum height estimate", () => {
    expect(estimateMarkdownBlockHeight("```mermaid\ngraph TD\n```")).toBe(200);
  });

  it("keeps live table height estimates close to the row count", () => {
    expect(estimateMarkdownBlockHeight("| A |\n| --- |\n| x |")).toBe(96);
  });

  it("anchors fold indicators at the first content character", () => {
    expect(getFoldAnchor({ from: 10, text: "  ## Heading" })).toBe(12);
    expect(getFoldAnchor({ from: 10, text: "## Heading" })).toBe(10);
  });

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
