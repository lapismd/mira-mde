import { describe, expect, it } from "vitest";
import {
  findMarkdownImageRanges,
  isStandaloneMarkdownImageLine,
  resolveMarkdownImageWidgetSource,
  markdownImageReferenceLabel,
} from "./images";

describe("markdown image helpers", () => {
  it.each(["![photo][photo]", "![photo][]", "![photo]"])(
    "resolves %s without leaking matcher state",
    (usage) => {
      const doc = `${usage}\n\n[PHOTO]: </a file.svg>\n  "Title"`;
      expect(markdownImageReferenceLabel(usage, doc)).toBe("PHOTO");
      const first = findMarkdownImageRanges(usage, doc);
      expect(first).toHaveLength(1);
      expect(first[0]?.referenceLabel).toBe("PHOTO");
      expect(first[0]?.source).toContain("[PHOTO]: </a file.svg>");
      expect(findMarkdownImageRanges(usage, doc)).toEqual(first);
    },
  );
  it("does not resolve definitions inside code and retains undefined references", () => {
    expect(
      findMarkdownImageRanges("![photo][ref]", "```md\n[ref]: /a.svg\n```"),
    ).toEqual([]);
    expect(findMarkdownImageRanges("![missing][]")).toEqual([]);
    expect(markdownImageReferenceLabel("![direct](/a.svg)")).toBeUndefined();
  });
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
          source:
            "![Reference base64][base64-red]\n\n[base64-red]: data:image/png;base64,abc=",
          referenceLabel: "base64-red",
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
