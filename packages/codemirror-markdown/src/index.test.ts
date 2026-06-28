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
});
