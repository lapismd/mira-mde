import { describe, expect, it } from "vitest";
import {
  findMarkdownImageRanges,
  isStandaloneMarkdownImageLine,
  resolveMarkdownImageWidgetSource,
} from "./images";

describe("markdown image helpers", () => {
  it("finds inline destination images and skips wiki embeds / code", () => {
    expect(
      findMarkdownImageRanges(
        'See ![shot](https://cdn.example/a.png "title") and ![[Note]]',
      ),
    ).toEqual([
      {
        from: 4,
        to: 46,
        source: '![shot](https://cdn.example/a.png "title")',
      },
    ]);

    expect(findMarkdownImageRanges("code `![x](y)` stays")).toEqual([]);
    expect(findMarkdownImageRanges("![[Architecture Diagram]]")).toEqual([]);
  });

  it("resolves reference-style images from document definitions", () => {
    const document = [
      "![Reference base64][base64-red]",
      "",
      "[base64-red]: data:image/png;base64,abc=",
    ].join("\n");

    expect(findMarkdownImageRanges(document.split("\n")[0]!, document)).toEqual(
      [
        {
          from: 0,
          to: 31,
          source: "![Reference base64](data:image/png;base64,abc=)",
        },
      ],
    );

    expect(
      resolveMarkdownImageWidgetSource("![missing][nope]", document),
    ).toBeNull();
  });

  it("detects standalone image lines including data URIs", () => {
    expect(
      isStandaloneMarkdownImageLine(
        "  ![Inline base64](data:image/png;base64,abc=)  ",
      ),
    ).toBe(true);
    expect(
      isStandaloneMarkdownImageLine("![Uploading shot.png…](mira-uploading:1)"),
    ).toBe(true);
    expect(
      isStandaloneMarkdownImageLine("![Reference base64][base64-red]"),
    ).toBe(true);
    expect(isStandaloneMarkdownImageLine("![x](y) trailing")).toBe(false);
    expect(isStandaloneMarkdownImageLine("![[Note]]")).toBe(false);
  });
});
