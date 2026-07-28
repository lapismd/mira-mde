import { EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import { buildCodeBlockLineDecorations } from "./code-block-lines";

function lineClasses(source: string): string[] {
  const state = EditorState.create({
    doc: source,
  });
  const classes: string[] = [];
  buildCodeBlockLineDecorations(state).between(
    0,
    state.doc.length,
    (_from, _to, decoration) => {
      if (decoration.spec.class) {
        classes.push(decoration.spec.class);
      }
    },
  );
  return classes;
}

describe("code block line decorations", () => {
  it("marks every explicit text-fence line for source no-wrap geometry", () => {
    const classes = lineClasses(
      ["```text", "A very long text diagram line", "```"].join("\n"),
    );

    expect(classes).toHaveLength(3);
    expect(classes).toEqual([
      "HyperMD-codeblock HyperMD-codeblock-bg cm-formatting-code-language-text",
      "HyperMD-codeblock HyperMD-codeblock-bg cm-formatting-code-language-text",
      "HyperMD-codeblock HyperMD-codeblock-bg cm-formatting-code-language-text",
    ]);
  });

  it("keeps other fenced languages on the normal code line class", () => {
    expect(lineClasses("```mermaid\nflowchart LR\n```")).not.toContain(
      "HyperMD-codeblock HyperMD-codeblock-bg cm-formatting-code-language-text",
    );
  });
});
