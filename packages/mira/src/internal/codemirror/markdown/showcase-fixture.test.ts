import { readFileSync } from "node:fs";
import path from "node:path";
import { ensureSyntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import { createMarkdownCodeMirrorExtensions } from ".";

const fixturePath = path.resolve(
  import.meta.dirname,
  "../../../../../../stories/markdown/layout/CodeMirror Layout Showcase.md",
);

describe("Mira CodeMirror Layout Showcase fixture", () => {
  it("exercises the parser extensions used by every editor mode", () => {
    const source = readFileSync(fixturePath, "utf8");
    const state = EditorState.create({
      doc: source,
      extensions: createMarkdownCodeMirrorExtensions(),
    });
    const tree = ensureSyntaxTree(state, state.doc.length, 1_000);
    expect(tree).not.toBeNull();
    const cursor = tree!.cursor();
    const names: string[] = [];

    function walk(): void {
      names.push(cursor.name);
      if (!cursor.firstChild()) {
        return;
      }
      do {
        walk();
      } while (cursor.nextSibling());
      cursor.parent();
    }
    walk();

    expect(names).toEqual(
      expect.arrayContaining([
        "Document",
        "ATXHeading1",
        "ATXHeading2",
        "Table",
        "GridTable",
        "Blockquote",
        "BulletList",
        "OrderedList",
        "WikiLink",
        "EmbedLink",
        "PathLink",
        "Tag",
        "InlineDirective",
        "LeafDirective",
        "FencedCode",
        "BlockMathDollar",
        "InlineMathDollar",
      ]),
    );
  });
});
