import { describe, expect, it } from "vitest";
import {
  parseMiraImageDetails,
  selectMarkdownEmbedFragment,
} from "./embed-target";

describe("portable embed targets", () => {
  const markdown = [
    "# Project",
    "",
    "Introduction.",
    "",
    "## Next Steps",
    "",
    "Ship the adapter.",
    "",
    "### Detail",
    "",
    "Keep this nested section.",
    "",
    "## Decisions",
    "",
    "Use target watchers.",
    "",
    "A portable referenced paragraph. ^decision-1",
  ].join("\n");

  it("selects heading sections through the next sibling heading", () => {
    expect(
      selectMarkdownEmbedFragment(markdown, {
        kind: "heading",
        value: "Next Steps",
      }),
    ).toEqual({
      found: true,
      markdown: [
        "## Next Steps",
        "",
        "Ship the adapter.",
        "",
        "### Detail",
        "",
        "Keep this nested section.",
        "",
      ].join("\n"),
    });
  });

  it("accepts heading slugs and selects block references without the marker", () => {
    expect(
      selectMarkdownEmbedFragment(markdown, {
        kind: "heading",
        value: "next-steps",
      }).found,
    ).toBe(true);
    expect(
      selectMarkdownEmbedFragment(markdown, {
        kind: "block",
        value: "decision-1",
      }),
    ).toEqual({
      found: true,
      markdown: "A portable referenced paragraph.",
    });
  });

  it("reports missing fragments without falling back to the whole note", () => {
    expect(
      selectMarkdownEmbedFragment(markdown, {
        kind: "heading",
        value: "Missing",
      }),
    ).toEqual({ found: false, markdown: "" });
  });
});

describe("image details", () => {
  it("parses Lapis-style width and width-by-height suffixes", () => {
    expect(parseMiraImageDetails("Diagram|640x360")).toEqual({
      alt: "Diagram",
      width: 640,
      height: 360,
    });
    expect(parseMiraImageDetails("320", "diagram.png")).toEqual({
      alt: "diagram.png",
      width: 320,
    });
  });

  it("preserves ordinary alt text", () => {
    expect(parseMiraImageDetails("Architecture diagram")).toEqual({
      alt: "Architecture diagram",
    });
  });
});
