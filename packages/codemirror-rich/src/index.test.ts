import { describe, expect, it } from "vitest";
import {
  createRichEditorExtensions,
  estimateMarkdownBlockHeight,
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
});
