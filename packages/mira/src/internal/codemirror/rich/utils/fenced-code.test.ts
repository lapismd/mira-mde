import { describe, expect, it } from "vitest";
import { getFencedCodeLanguage, getFencedCodeWidgetRange } from "./fenced-code";

describe("fenced code helpers", () => {
  it("detects fenced code language and replacement range", () => {
    const markdown = "```mermaid\ngraph TD\n  A --> B\n```\n";

    expect(getFencedCodeLanguage(markdown)).toBe("mermaid");
    expect(getFencedCodeWidgetRange(markdown)).toEqual({
      from: 0,
      to: markdown.trimEnd().length,
    });
  });
});
