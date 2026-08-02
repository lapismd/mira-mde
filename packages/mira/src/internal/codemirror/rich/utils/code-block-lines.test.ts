import { EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import {
  buildCodeBlockLineDecorations,
  isFencedCodeLine,
} from "./code-block-lines";

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
      "HyperMD-codeblock HyperMD-codeblock-bg cm-formatting-code cm-formatting-code-language-text cm-formatting-code-start",
      "HyperMD-codeblock HyperMD-codeblock-bg cm-formatting-code cm-formatting-code-language-text",
      "HyperMD-codeblock HyperMD-codeblock-bg cm-formatting-code cm-formatting-code-language-text cm-formatting-code-end",
    ]);
  });

  it("keeps other fenced languages with code chrome and start/end radius hooks", () => {
    const classes = lineClasses("```mermaid\nflowchart LR\n```");
    expect(classes).toEqual([
      "HyperMD-codeblock HyperMD-codeblock-bg cm-formatting-code cm-formatting-code-start",
      "HyperMD-codeblock HyperMD-codeblock-bg cm-formatting-code",
      "HyperMD-codeblock HyperMD-codeblock-bg cm-formatting-code cm-formatting-code-end",
    ]);
  });

  it("detects fenced body lines for indent suppression", () => {
    const state = EditorState.create({
      doc: ["~~~mermaid", "  Source --> LivePreview", "~~~", "  outside"].join(
        "\n",
      ),
    });
    expect(isFencedCodeLine(state, 1)).toBe(true);
    expect(isFencedCodeLine(state, 2)).toBe(true);
    expect(isFencedCodeLine(state, 3)).toBe(true);
    expect(isFencedCodeLine(state, 4)).toBe(false);
  });
});
