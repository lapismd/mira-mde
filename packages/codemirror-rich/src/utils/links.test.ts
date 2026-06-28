import { describe, expect, it } from "vitest";
import {
  getMarkdownLinkTextRange,
  isBareExternalAutolinkUrl,
  isExternalMarkdownDestination,
  isExternalMarkdownLink,
} from "./links";

describe("link helpers", () => {
  it("classifies external markdown links and bare autolinks", () => {
    expect(isExternalMarkdownDestination("https://example.com")).toBe(true);
    expect(isExternalMarkdownDestination("//example.com")).toBe(true);
    expect(isExternalMarkdownDestination("notes/architecture.md")).toBe(false);
    expect(isExternalMarkdownLink("[external](https://example.com)")).toBe(
      true,
    );
    expect(isExternalMarkdownLink("[internal](notes/architecture.md)")).toBe(
      false,
    );
    expect(
      isBareExternalAutolinkUrl("URL", undefined, "https://example.com"),
    ).toBe(true);
    expect(
      isBareExternalAutolinkUrl("URL", "Link", "https://example.com"),
    ).toBe(false);
  });

  it("resolves decorated text ranges for markdown links", () => {
    expect(getMarkdownLinkTextRange("[label](target.md)", 10, 28)).toEqual({
      from: 11,
      to: 16,
    });
    expect(getMarkdownLinkTextRange("<https://example.com>", 20, 41)).toEqual({
      from: 21,
      to: 40,
    });
    expect(getMarkdownLinkTextRange("https://example.com", 30, 49)).toEqual({
      from: 30,
      to: 49,
    });
    expect(getMarkdownLinkTextRange("not a link", 0, 10)).toBeNull();
  });
});
