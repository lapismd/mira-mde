import { syntaxTree } from "@codemirror/language";
import {
  EditorSelection,
  Prec,
  type Extension,
  type Range,
} from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  keymap,
  type KeyBinding,
  type PluginValue,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";
import type { RootContent } from "mdast";
import { GridTableNode } from "./grid-table";
import type { TableExtensionProps } from "./types";

type GridTableCoordinates = {
  from: number;
  pos: number;
  to: number;
};

export function getGridTableNode(
  view: EditorView,
): [GridTableNode | null, GridTableCoordinates] {
  const cursor = view.state.selection.main.head;
  const line = view.state.doc.lineAt(cursor);
  let tableNode: GridTableNode | null = null;
  const coordinates = { from: 0, pos: 0, to: 0 };

  syntaxTree(view.state).iterate({
    from: line.from,
    to: line.to,
    enter(node) {
      if (node.name !== "GridTable") return;

      tableNode = GridTableNode.fromMarkdown(
        view.state.sliceDoc(node.from, node.to),
      );
      coordinates.from = node.from;
      coordinates.to = node.to;
      coordinates.pos = cursor - node.from;
      return false;
    },
  });

  return [tableNode, coordinates];
}

function selectGridCell(
  view: EditorView,
  tableNode: GridTableNode,
  coordinates: GridTableCoordinates,
  cell: { x: number; y: number },
): boolean {
  const nextCell = tableNode.rerender().cellAt(cell);
  if (!nextCell) return false;

  const selection = EditorSelection.create(
    nextCell.cell.positions.map((position) =>
      EditorSelection.range(
        coordinates.from + position.to,
        coordinates.from + position.from,
      ),
    ),
  );

  view.dispatch({
    changes: {
      from: coordinates.from,
      insert: tableNode.toMarkdown().trim(),
      to: coordinates.to,
    },
    selection,
  });
  return true;
}

export function gridTableTabAction(delta: number) {
  return (view: EditorView): boolean => {
    const [tableNode, coordinates] = getGridTableNode(view);
    if (!tableNode) return false;

    let cell = tableNode.cellAt(coordinates.pos);
    if (!cell) return false;

    if (cell.x + delta < 0) {
      const previous = tableNode.nextColumn(cell, { x: 0, y: -1 });
      if (previous) cell = previous;
    } else if (cell.x + delta >= tableNode.getColCount()) {
      const x = tableNode.getColCount();
      tableNode.insertColumnAt(x);
      cell = tableNode.cellAt({ x, y: cell.y })!;
    } else {
      const next = tableNode.nextColumn(cell, { x: delta, y: 0 });
      if (!next) return false;
      cell = next;
    }

    return selectGridCell(view, tableNode, coordinates, cell);
  };
}

function gridTableEnterAction(insertRow: boolean) {
  return (view: EditorView): boolean => {
    const [tableNode, coordinates] = getGridTableNode(view);
    if (!tableNode) return false;

    let cell = tableNode.cellAt(coordinates.pos);
    if (!cell) return false;

    const next = tableNode.nextColumn(cell, { x: 0, y: 1 });
    if (!next) {
      const y = tableNode.getRowCount();
      tableNode.insertRowAt(y);
      cell = tableNode.cellAt({ x: cell.x, y })!;
    } else if (insertRow) {
      tableNode.insertRowAt(next.y);
      cell = tableNode.cellAt({ x: next.x, y: next.y })!;
    } else {
      cell = next;
    }

    return selectGridCell(view, tableNode, coordinates, cell);
  };
}

function gridTableLineBreakAction(view: EditorView): boolean {
  const [tableNode, coordinates] = getGridTableNode(view);
  if (!tableNode) return false;

  const cell = tableNode.cellAt(coordinates.pos);
  if (!cell) return false;

  tableNode.updateCellContents(cell.x, cell.y, [
    ...cell.cell.children,
    { type: "text", value: "<br>" },
  ] as RootContent[]);

  const nextCell = tableNode.rerender().cellAt(cell);
  const lastPosition = nextCell?.cell.positions.at(-1);
  if (!lastPosition) return false;

  const cursor = coordinates.from + lastPosition.from;
  view.dispatch({
    changes: {
      from: coordinates.from,
      insert: tableNode.toMarkdown().trim(),
      to: coordinates.to,
    },
    selection: { anchor: cursor, head: cursor },
  });
  return true;
}

const gridTableLineDecoration = Decoration.line({
  class: "cm-table cm-formatting-table cm-formatting-grid-table",
  attributes: { tabindex: "0" },
});

class GridTableDecoration implements PluginValue {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.process(view);
  }

  update(update: ViewUpdate): void {
    if (update.docChanged || update.viewportChanged || update.selectionSet) {
      this.decorations = this.process(update.view);
    }
  }

  private process(view: EditorView): DecorationSet {
    const decorations: Range<Decoration>[] = [];
    const decoratedLines = new Set<number>();

    for (const { from, to } of view.visibleRanges) {
      syntaxTree(view.state).iterate({
        from,
        to,
        enter(node) {
          if (node.name !== "GridTable") return;

          let line = view.state.doc.lineAt(node.from);
          while (!decoratedLines.has(line.number)) {
            decoratedLines.add(line.number);
            decorations.push(gridTableLineDecoration.range(line.from));
            if (line.to >= node.to || line.number >= view.state.doc.lines)
              break;
            line = view.state.doc.line(line.number + 1);
          }
          return false;
        },
      });
    }

    return Decoration.set(decorations, true);
  }
}

export function gridTableExtension({
  bindEnter = true,
  bindTab = true,
}: Partial<TableExtensionProps> = {}): Extension {
  const keymaps: KeyBinding[] = [];

  if (bindEnter) {
    keymaps.push(
      {
        key: "Meta-Enter",
        run: gridTableEnterAction(true),
      },
      {
        key: "Enter",
        preventDefault: true,
        run: gridTableEnterAction(false),
        shift: gridTableLineBreakAction,
      },
    );
  }

  if (bindTab) {
    keymaps.push({
      key: "Tab",
      preventDefault: true,
      run: gridTableTabAction(1),
      shift: gridTableTabAction(-1),
    });
  }

  return [
    Prec.highest(keymap.of(keymaps)),
    ViewPlugin.fromClass(GridTableDecoration, {
      decorations: (value) => value.decorations,
    }),
  ];
}
