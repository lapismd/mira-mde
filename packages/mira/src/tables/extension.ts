// @ts-nocheck
import { syntaxTree } from "@codemirror/language";
import { Prec, Range, type Extension } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  keymap,
  ViewPlugin,
  ViewUpdate,
  type DecorationSet,
  type KeyBinding,
  type PluginValue,
} from "@codemirror/view";
import { TableNode } from "./table-node";
import type { TableExtensionProps } from "./types";

export {
  getGridTableNode,
  gridTableExtension,
  gridTableTabAction,
} from "./grid-table-extension";
import { gridTableExtension } from "./grid-table-extension";
import { tableLineScrollSync } from "./table-line-scroll-sync";

export function getTableNode(
  view: EditorView,
): [
  TableNode | null,
  { column: number; from: number; to: number; pos: number },
] {
  const cursor = view.state.selection.main.head;
  const line = view.state.doc.lineAt(cursor);
  let tableNode: TableNode | null = null;
  const coords = { column: cursor - line.from, from: 0, to: 0, pos: 0 };
  syntaxTree(view.state).iterate({
    from: line.from,
    to: line.to,
    enter(node) {
      if (node.name === "Table") {
        const content = view.state.sliceDoc(node.from, node.to);
        tableNode = TableNode.fromMarkdown(content);
        coords.from = node.from;
        coords.to = node.to;
        coords.pos = cursor - node.from;
        return false;
      }
    },
  });
  return [tableNode, coords];
}

export function tabAction(delta: number) {
  return (view: EditorView): boolean => {
    const [tableNode, coords] = getTableNode(view);
    if (!tableNode) {
      return false;
    }
    const cell = tableNode.coordsAt(coords.pos);
    if (!cell) {
      return false;
    }
    let row = cell[0];
    const column = cell[1];
    let index = column + delta;
    if (index >= tableNode.getColCount()) {
      tableNode.insertColumnAt(index);
    }

    if (index < 0) {
      row--;
      index = tableNode.getColCount() - 1;
    }

    const pos = tableNode.rerender().position(row, index);
    if (pos) {
      const head = coords.from + pos.start.offset!;
      const anchor = coords.from + pos.end.offset!;
      view.dispatch({
        changes: {
          insert: tableNode.toMarkdown().trim(),
          from: coords.from,
          to: coords.to,
        },
        selection: { head, anchor },
      });
      return true;
    }
    return true;
  };
}

const decorationTable = Decoration.line({
  class: "cm-table cm-formatting-table",
  attributes: { tabindex: "0" },
});

class TableDecoration implements PluginValue {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.process(view);
  }

  update(update: ViewUpdate): void {
    if (update.docChanged || update.viewportChanged || update.selectionSet)
      this.decorations = this.process(update.view);
  }

  process(view: EditorView): DecorationSet {
    const widgets: Range<Decoration>[] = [];
    const cachedTableLines = new Set<number>();
    for (const { from, to } of view.visibleRanges) {
      syntaxTree(view.state).iterate({
        from,
        to,
        enter(node) {
          let line = view.state.doc.lineAt(node.from);
          if (node.name === "Table" && !cachedTableLines.has(line.number)) {
            cachedTableLines.add(line.number);
            do {
              widgets.push(decorationTable.range(line.from));
              line = view.state.doc.line(line.number + 1);
            } while (line.to <= node.to);
          }
        },
      });
    }

    return Decoration.set(
      widgets.sort((a, b) => {
        if (a.from == b.from) {
          return a.value.startSide - b.value.startSide;
        }
        return a.from - b.from;
      }),
    );
  }
}

export function tableExtension({
  bindEnter = true,
  bindTab = true,
}: Partial<TableExtensionProps> = {}): Extension {
  const keymaps: KeyBinding[] = [];

  if (bindEnter) {
    keymaps.push({
      key: "Enter",
      run: tableEnterAction,
      shift: (view: EditorView): boolean => {
        const [tableNode, coords] = getTableNode(view);
        if (!tableNode) {
          return false;
        }
        const cell = tableNode.coordsAt(coords.pos);
        if (!cell) {
          return false;
        }

        const [row] = cell;
        tableNode.insertRowAt(row + 1);
        const pos = tableNode.rerender().position(row + 1, 0);
        if (pos) {
          const head = coords.from + pos.start.offset! + 1;
          const anchor = head;
          view.dispatch({
            selection: { head, anchor },
            changes: {
              insert: tableNode.toMarkdown().trim(),
              from: coords.from,
              to: coords.to,
            },
          });
          return true;
        }
        return false;
      },
      preventDefault: true,
    });
  }

  if (bindTab) {
    keymaps.push({
      key: "Tab",
      run: tabAction(1),
      shift: tabAction(-1),
      preventDefault: true,
    });
  }

  return [
    Prec.highest(keymap.of(keymaps)),
    ViewPlugin.fromClass(TableDecoration, {
      decorations: (v) => v.decorations,
    }),
  ];
}

export function tableEnterAction(view: EditorView): boolean {
  const [tableNode, coords] = getTableNode(view);
  if (!tableNode) {
    return false;
  }
  const cell = tableNode.coordsAt(coords.pos);
  if (!cell) {
    return false;
  }

  const [row, col] = cell;
  if (row + 1 >= tableNode.getRowCount()) {
    tableNode.insertRowAt(row + 1);
  }

  const pos = tableNode.rerender().position(row + 1, col);
  if (!pos) {
    return false;
  }

  const head = coords.from + pos.start.offset!;
  const anchor = coords.from + pos.end.offset!;
  view.dispatch({
    selection: { head, anchor },
    changes: {
      insert: tableNode.toMarkdown().trim(),
      from: coords.from,
      to: coords.to,
    },
  });
  return true;
}

export function createTableExtensions(): Extension[] {
  return [tableExtension(), gridTableExtension(), tableLineScrollSync()];
}
