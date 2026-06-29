import { syntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import { createInlineTableMarkdownExtensions } from "./inline-editor-extensions";

describe("createInlineTableMarkdownExtensions", () => {
  it("uses the shared Mira Markdown parser for rich table cell editing", () => {
    const state = EditorState.create({
      doc: [
        "**bold** _italic_ `code` [[Project Plan|Plan]] ![[Diagram]] #mira/table",
        "\\(x + 1\\)",
      ].join("\n"),
      extensions: createInlineTableMarkdownExtensions(),
    });
    const tree = syntaxTree(state).toString();

    expect(tree).toContain("StrongEmphasis");
    expect(tree).toContain("Emphasis");
    expect(tree).toContain("InlineCode");
    expect(tree).toContain("WikiLink");
    expect(tree).toContain("EmbedLink");
    expect(tree).toContain("Tag");
    expect(tree).toContain("InlineMathBracket");
  });
});
