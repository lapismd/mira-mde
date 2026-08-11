import { syntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { describe, expect, it } from "vitest";
import { createMarkdownCodeMirrorExtensions } from "../internal/codemirror/markdown/index";
import {
  gridTableExtension,
  gridTableTabAction,
  tableEnterAction,
  tableExtension,
} from "./extension";

const markdownTable = [
  "| Feature | Behavior |",
  "| --- | --- |",
  "| Handles | Actions |",
].join("\n");

const gridTableMarkdown = [
  "+---------+----------+",
  "| Feature | Behavior |",
  "+=========+==========+",
  "| Handles | Actions  |",
  "+---------+----------+",
].join("\n");

function createGridTableEditor(cursor: number): EditorView {
  const parent = document.createElement("div");
  document.body.append(parent);
  return new EditorView({
    parent,
    state: EditorState.create({
      doc: gridTableMarkdown,
      extensions: [
        createMarkdownCodeMirrorExtensions({ sourceMode: true }),
        gridTableExtension(),
      ],
      selection: { anchor: cursor },
    }),
  });
}

describe("table extension", () => {
  it("resolves extension facets for configured keymaps", () => {
    expect(tableExtension({ bindEnter: false, bindTab: false })).toHaveLength(
      2,
    );
    expect(
      gridTableExtension({ bindEnter: false, bindTab: false }),
    ).toHaveLength(2);
  });

  it("formats a grid table and selects the next cell on Tab", () => {
    const view = createGridTableEditor(gridTableMarkdown.indexOf("Feature"));

    expect(gridTableTabAction(1)(view)).toBe(true);
    expect(
      view.state.sliceDoc(
        view.state.selection.main.from,
        view.state.selection.main.to,
      ),
    ).toBe(" Behavior ");
    expect(view.state.doc.toString()).not.toMatch(/^\s+\| Feature/m);
    expect(syntaxTree(view.state).toString()).toContain("GridTable");

    view.destroy();
  });

  it("moves to the same column on the next pipe-table row with Enter", () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const view = new EditorView({
      parent,
      state: EditorState.create({
        doc: markdownTable,
        extensions: [createMarkdownCodeMirrorExtensions({ sourceMode: true })],
        selection: { anchor: markdownTable.indexOf("Behavior") },
      }),
    });

    expect(tableEnterAction(view)).toBe(true);
    expect(
      view.state.sliceDoc(
        view.state.selection.main.from,
        view.state.selection.main.to,
      ),
    ).toContain("Actions");

    view.destroy();
  });

  it("decorates every grid-table source row as monospaced table syntax", () => {
    const view = createGridTableEditor(gridTableMarkdown.indexOf("Feature"));
    const tableLines = view.dom.querySelectorAll(
      ".cm-line.cm-table.cm-formatting-table.cm-formatting-grid-table",
    );

    expect(tableLines).toHaveLength(5);

    view.destroy();
  });
});
