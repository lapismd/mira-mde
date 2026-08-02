import { describe, expect, it } from "vitest";
import { syntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { createMarkdownCodeMirrorExtensions } from ".";

describe("createMarkdownCodeMirrorExtensions", () => {
  it("returns markdown language and decoration extensions", () => {
    expect(createMarkdownCodeMirrorExtensions()).toHaveLength(3);
  });

  it("parses Lapis-style grid tables", () => {
    const state = EditorState.create({
      doc: [
        "+---------+----------+",
        "| Feature | Behavior |",
        "+=========+==========+",
        "| Menus   | Actions  |",
        "+---------+----------+",
      ].join("\n"),
      extensions: createMarkdownCodeMirrorExtensions(),
    });

    expect(syntaxTree(state).toString()).toContain("GridTable");
  });

  it.each([
    ["justify", ["+>-----<+", "| A b C |", "+-------+"]],
    ["center", ["+:-----:+", "|  ABC  |", "+-------+"]],
    ["left", ["+:------+", "| ABC   |", "+------+"]],
    ["right", ["+------:+", "|   ABC |", "+------+"]],
    [
      "top",
      [
        "+---^---+",
        "| Larum |",
        "| Ipsum |",
        "|       |",
        "|       |",
        "+-------+",
      ],
    ],
    [
      "middle",
      [
        "+---x---+",
        "|       |",
        "| Larum |",
        "| Ipsum |",
        "|       |",
        "+-------+",
      ],
    ],
    [
      "bottom",
      [
        "+---v---+",
        "|       |",
        "|       |",
        "| Larum |",
        "| Ipsum |",
        "+-------+",
      ],
    ],
  ])("parses Adobe %s alignment grid table separators", (_, markdown) => {
    const state = EditorState.create({
      doc: markdown.join("\n"),
      extensions: createMarkdownCodeMirrorExtensions(),
    });

    expect(syntaxTree(state).toString()).toContain("GridTable");
  });

  it("parses Lapis wikilink, embed, pathlink, and tag nodes", () => {
    const state = EditorState.create({
      doc: [
        "[[Project Plan#Section|Plan]]",
        "![[Architecture Diagram#Overview|Diagram]]",
        "[Project](notes/Project Plan.md)",
        "#mira/editor",
      ].join("\n"),
      extensions: createMarkdownCodeMirrorExtensions(),
    });
    const tree = syntaxTree(state).toString();

    expect(tree).toContain("WikiLink");
    expect(tree).toContain("WikiLinkPath");
    expect(tree).toContain("WikiLinkAnchor");
    expect(tree).toContain("WikiLinkText");
    expect(tree).toContain("EmbedLink");
    expect(tree).toContain("EmbedLinkPath");
    expect(tree).toContain("EmbedLinkAnchor");
    expect(tree).toContain("EmbedLinkText");
    expect(tree).toContain("PathLink");
    expect(tree).toContain("PathLinkDestination");
    expect(tree).toContain("Tag");
    expect(tree).toContain("TagName");
  });

  it("parses single-backslash bracket math delimiters", () => {
    const state = EditorState.create({
      doc: ["inline \\(x + 1\\)", "\\[", "x + 1", "\\]"].join("\n"),
      extensions: createMarkdownCodeMirrorExtensions(),
    });
    const tree = syntaxTree(state).toString();

    expect(tree).toContain("InlineMathBracket");
    expect(tree).toContain("BlockMathBracket");
  });

  it("parses container, leaf, and inline directives structurally", () => {
    const state = EditorState.create({
      doc: [
        ':::cell[Load data]{lang="ts"}',
        "```ts",
        "const value = 1;",
        "```",
        ":::",
        "",
        "::badge[Stable]{tone=success}",
        "",
        'Use :abbr[HTML]{title="HyperText Markup Language"}.',
      ].join("\n"),
      extensions: createMarkdownCodeMirrorExtensions(),
    });
    const tree = syntaxTree(state).toString();

    expect(tree).toContain("ContainerDirective");
    expect(tree).toContain("LeafDirective");
    expect(tree).toContain("InlineDirective");
    expect(tree).toContain("DirectiveName");
    expect(tree).toContain("DirectiveArgs");
    expect(tree).toContain("DirectiveAttrName");
    expect(tree).toContain("DirectiveAttrValue");
    expect(tree).toContain("FencedCode");
  });
});
