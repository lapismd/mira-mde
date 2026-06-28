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
import { mount } from "svelte";
import { TableNode } from "./table-node";
export * from "./table-node";

import EditorColumn from "./editor-column.svelte";
import EditorTable from "./editor-table.svelte";

export {
  EditorColumn,
  EditorColumn as column,
  EditorTable,
  EditorTable as Table,
};

export type MarkdownTable = {
  header: string[];
  align: Array<"left" | "center" | "right" | null>;
  rows: string[][];
};

export type MarkdownTableWidgetOptions = {
  markdown: string;
  onChange: (nextMarkdown: string) => void;
  onDelete?: () => void;
  onSource?: () => void;
};

export type TableExtensionProps = {
  bindEnter: boolean;
  bindTab: boolean;
};

function getTableNode(
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

function tabAction(delta: number) {
  return (view: EditorView): boolean => {
    const [tableNode, coords] = getTableNode(view);
    if (!tableNode) {
      return false;
    }
    const cell = tableNode.coordsAt(coords.pos);
    if (!cell) {
      return false;
    }
    let [row, col] = cell;
    let index = col + delta;
    if (index >= tableNode.getColCount()) {
      tableNode.insertColumnAt(index);
    }

    if (index < 0) {
      row--;
      index = tableNode.getColCount() - 1;
    }

    let pos = tableNode.rerender().position(row, index);
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
    let widgets: Range<Decoration>[] = [];
    const cachedTableLines = new Set<number>();
    for (let { from, to } of view.visibleRanges) {
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
      run: (view: EditorView): boolean => {
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

        let pos = tableNode.rerender().position(row + 1, col);
        if (pos) {
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
        return false;
      },
      shift: (view: EditorView): boolean => {
        const [tableNode, coords] = getTableNode(view);
        if (!tableNode) {
          return false;
        }
        const cell = tableNode.coordsAt(coords.pos);
        if (!cell) {
          return false;
        }

        const [row, col] = cell;
        tableNode.insertRowAt(row + 1);
        let pos = tableNode.rerender().position(row + 1, 0);
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

export function createTableExtensions(): Extension[] {
  return [tableExtension()];
}

export function parseMarkdownTable(markdown: string): MarkdownTable | null {
  const node = TableNode.fromMarkdown(markdown);
  if (!node) {
    return null;
  }

  const table = node.getMdastNode();
  const [headerRow, ...bodyRows] = table.children;
  if (!headerRow) {
    return null;
  }

  return {
    header: headerRow.children.map(cellToText),
    align: headerRow.children.map((_, index) => {
      const align = table.align?.[index] ?? null;
      return align === "left" || align === "center" || align === "right"
        ? align
        : null;
    }),
    rows: bodyRows.map((row) => row.children.map(cellToText)),
  };
}

export function formatMarkdownTable(table: MarkdownTable): string {
  const widths = table.header.map((cell, index) =>
    Math.max(
      cell.length,
      alignmentMarker(table.align[index] ?? null).length,
      ...table.rows.map((row) => row[index]?.length ?? 0),
    ),
  );

  const renderRow = (row: string[]) =>
    `| ${widths.map((width, index) => (row[index] ?? "").padEnd(width)).join(" | ")} |`;

  return [
    renderRow(table.header),
    `| ${widths
      .map((width, index) =>
        formatAlignmentMarker(table.align[index] ?? null, width),
      )
      .join(" | ")} |`,
    ...table.rows.map(renderRow),
  ].join("\n");
}

export function createMarkdownTableWidget({
  markdown,
  onChange,
  onDelete,
  onSource,
}: MarkdownTableWidgetOptions): HTMLElement {
  const root = document.createElement("div");
  root.className = "mira-table-widget-shell relative";
  root.contentEditable = "false";

  if (onSource) {
    root.append(createSourceButton(onSource));
  }

  const node =
    TableNode.fromMarkdown(markdown) ??
    TableNode.fromMarkdown("|  |\n| --- |\n|  |") ??
    new TableNode();

  mount(EditorTable, {
    target: root,
    props: {
      node,
      onChange: (nextMarkdown: string) => onChange(nextMarkdown.trimEnd()),
      onDelete: () => onDelete?.(),
    },
  });

  return root;
}

function cellToText(node: Parameters<typeof TableNode.toMarkdown>[0]): string {
  return TableNode.toMarkdown(node).trim();
}

function alignmentMarker(align: MarkdownTable["align"][number]): string {
  if (align === "left") {
    return ":---";
  }
  if (align === "center") {
    return ":---:";
  }
  if (align === "right") {
    return "---:";
  }
  return "---";
}

function formatAlignmentMarker(
  align: MarkdownTable["align"][number],
  width: number,
): string {
  const marker = alignmentMarker(align);
  if (align === "right") {
    return `${"-".repeat(Math.max(3, width - 1))}:`;
  }
  if (align === "center") {
    return `:${"-".repeat(Math.max(3, width - 2))}:`;
  }
  if (align === "left") {
    return `:${"-".repeat(Math.max(3, width - 1))}`;
  }
  return marker.padEnd(width, "-");
}

function createSourceButton(onSource: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className =
    "markdown-widget-select-control mira-table-widget__source-toggle";
  button.title = "Edit table source";
  button.setAttribute("aria-label", "Edit table source");
  button.innerHTML =
    '<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 16 4-4-4-4"></path><path d="m6 8-4 4 4 4"></path><path d="m14.5 4-5 16"></path></svg>';
  button.addEventListener("mousedown", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onSource();
  });
  return button;
}
