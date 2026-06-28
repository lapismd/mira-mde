// @ts-nocheck
import type * as Mdast from "mdast";
import { gfmTable } from "micromark-extension-gfm-table";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmTableFromMarkdown, gfmTableToMarkdown } from "mdast-util-gfm-table";
import { toMarkdown } from "mdast-util-to-markdown";

const EMPTY_CELL: Mdast.TableCell = {
  type: "tableCell",
  children: [] as Mdast.PhrasingContent[],
};

type CoordinatesSubscription = (
  coords: [colIndex: number, rowIndex: number],
) => void;

function coordinatesEmitter() {
  let subscription: CoordinatesSubscription = () => {};
  return {
    publish: (coords: [colIndex: number, rowIndex: number]) => {
      subscription(coords);
    },
    subscribe: (cb: CoordinatesSubscription) => {
      subscription = cb;
    },
  };
}

function arrayMove<T>(
  arr: Array<T>,
  old_index: number,
  new_index: number,
  defaultValue: T,
) {
  if (new_index >= arr.length) {
    var k = new_index - arr.length + 1;
    while (k--) {
      arr.push(structuredClone(defaultValue));
    }
  }
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
  return arr;
}

export class TableNode {
  /** @internal */
  __mdastNode: Mdast.Table;
  /** @internal */
  focusEmitter = coordinatesEmitter();

  /** @internal */
  static clone(node: TableNode): TableNode {
    return new TableNode(structuredClone(node.__mdastNode));
  }

  static fromMarkdown(doc: string) {
    const root = fromMarkdown(doc, {
      extensions: [gfmTable()],
      mdastExtensions: [gfmTableFromMarkdown()],
    });
    if (root.children[0]?.type === "table") {
      return new TableNode(root.children[0]);
    }
    return null;
  }

  static toMarkdown(node: Mdast.Nodes): string {
    return toMarkdown(node, { extensions: [gfmTableToMarkdown()] });
  }

  toMarkdown() {
    return toMarkdown(this.__mdastNode, { extensions: [gfmTableToMarkdown()] });
  }

  rerender(): this {
    this.__mdastNode = TableNode.fromMarkdown(this.toMarkdown())!.__mdastNode;
    return this;
  }

  /**
   * Constructs a new {@link TableNode} with the specified MDAST table node as
   * the object to edit. See
   * {@link https://github.com/micromark/micromark-extension-gfm-table | micromark/micromark-extension-gfm-table}
   * for more information on the MDAST table node.
   */
  constructor(mdastNode?: Mdast.Table) {
    this.__mdastNode = mdastNode ?? { type: "table", children: [] };
  }

  /** Returns the mdast node that this node is constructed from. */
  getMdastNode(): Mdast.Table {
    return this.__mdastNode;
  }

  /** Returns the number of rows in the table. */
  getRowCount(): number {
    return this.__mdastNode.children.length;
  }

  /** Returns the number of columns in the table. */
  getColCount(): number {
    return this.__mdastNode.children[0]?.children.length || 0;
  }

  /** @internal */
  updateCellContents(
    colIndex: number,
    rowIndex: number,
    children: Mdast.PhrasingContent[] | string,
  ): void {
    if (typeof children === "string") {
      const root = fromMarkdown(children, {
        extensions: [gfmTable()],
        mdastExtensions: [gfmTableFromMarkdown()],
      });
      this.updateCellContents(
        colIndex,
        rowIndex,
        root.children as Mdast.PhrasingContent[],
      );
      return;
    }
    const table = this.__mdastNode;
    const row = table.children[rowIndex];
    const cells = row.children;
    const cell = cells[colIndex];
    const cellsClone = Array.from(cells);
    const cellClone = { ...cell, children };
    const rowClone = { ...row, children: cellsClone };
    cellsClone[colIndex] = cellClone;
    table.children[rowIndex] = rowClone;
  }

  insertColumnAt(colIndex: number): void {
    const table = this.__mdastNode;
    for (let rowIndex = 0; rowIndex < table.children.length; rowIndex++) {
      const row = table.children[rowIndex];
      const cells = row.children;
      const cellsClone = Array.from(cells);
      const rowClone = { ...row, children: cellsClone };
      cellsClone.splice(colIndex, 0, structuredClone(EMPTY_CELL));
      table.children[rowIndex] = rowClone;
    }

    if (table.align && table.align.length > 0) {
      table.align.splice(colIndex, 0, "left");
    }
  }

  deleteColumnAt(colIndex: number): void {
    const table = this.__mdastNode;
    for (let rowIndex = 0; rowIndex < table.children.length; rowIndex++) {
      const row = table.children[rowIndex];
      const cells = row.children;
      const cellsClone = Array.from(cells);
      const rowClone = { ...row, children: cellsClone };
      cellsClone.splice(colIndex, 1);
      table.children[rowIndex] = rowClone;
    }
  }

  duplicateColumnAt(colIndex: number): void {
    const table = this.__mdastNode;
    for (let rowIndex = 0; rowIndex < table.children.length; rowIndex++) {
      const row = table.children[rowIndex];
      const cells = row.children;
      const cellsClone = Array.from(cells);
      const rowClone = { ...row, children: cellsClone };
      cellsClone.splice(colIndex, 0, structuredClone(cellsClone[colIndex]));
      table.children[rowIndex] = rowClone;
    }
  }

  moveColumn(colIndex: number, newIndex: number): void {
    const table = this.__mdastNode;
    for (let rowIndex = 0; rowIndex < table.children.length; rowIndex++) {
      const row = table.children[rowIndex];
      const cells = row.children;
      const cellsClone = Array.from(cells);
      const rowClone = { ...row, children: cellsClone };
      arrayMove(cellsClone, colIndex, newIndex, EMPTY_CELL);
      table.children[rowIndex] = rowClone;
    }
  }

  position(rowIndex: number, colIndex?: number): any {
    const row = this.__mdastNode.children[rowIndex];
    if (!row) {
      return null;
    }
    if (colIndex === undefined) {
      return row.position;
    }

    const cell = row.children[colIndex];
    if (cell.children.length > 0 && cell.children[0].position) {
      return cell.children[0].position;
    }

    if (cell.position) {
      const pos = cell.position;
      pos.start.offset = 1 + pos.start.offset!;
      pos.end.offset = pos.end.offset! - 1;
      return pos;
    }
  }

  coordsAt(position: number) {
    const table = this.__mdastNode;
    for (let rowIndex = 0; rowIndex < table.children.length; rowIndex++) {
      const row = table.children[rowIndex];
      let [x, y] = [
        row.position?.start?.offset ?? -1,
        row.position?.end?.offset ?? -1,
      ];
      if (x !== -1 && position >= x && y !== -1 && position <= y) {
        const cells = row.children;
        for (let colIndex = 0; colIndex < cells.length; colIndex++) {
          const cell = cells[colIndex];
          let [x, y] = [
            cell.position?.start?.offset ?? -1,
            cell.position?.end?.offset ?? -1,
          ];
          if (x !== -1 && position >= x && y !== -1 && position <= y) {
            return [rowIndex, colIndex];
          }
        }
      }
    }
  }

  get lastCell() {
    return [this.getRowCount() - 1, this.getColCount() - 1];
  }

  duplicateRowAt(y: number): void {
    const table = this.__mdastNode;
    const newRow = structuredClone(table.children[y]);
    table.children.splice(y, 0, newRow);
  }

  moveRow(oldIndex: number, newIndex: number): void {
    const newRow: Mdast.TableRow = {
      type: "tableRow",
      children: Array.from({ length: this.getColCount() }, () =>
        structuredClone(EMPTY_CELL),
      ),
    };
    arrayMove(this.__mdastNode.children, oldIndex, newIndex, newRow);
  }

  insertRowAt(y: number): void {
    const table = this.__mdastNode;
    const newRow: Mdast.TableRow = {
      type: "tableRow",
      children: Array.from({ length: this.getColCount() }, () =>
        structuredClone(EMPTY_CELL),
      ),
    };
    table.children.splice(y, 0, newRow);
  }

  deleteRowAt(rowIndex: number): void {
    this.__mdastNode.children.splice(rowIndex, 1);
  }

  transpose() {
    this.__mdastNode.children = this.__mdastNode.children[0].children.map(
      (_, colIndex) => {
        return {
          type: "tableRow",
          children: this.__mdastNode.children.map(
            (row) => row.children[colIndex],
          ),
        };
      },
    );
  }

  sort(columnIndex: number, asc: boolean = true) {
    if (!this.__mdastNode.children.length) {
      return;
    }
    let children = this.__mdastNode.children.slice(1).sort((a, b) => {
      const x = TableNode.toMarkdown(a.children[columnIndex]);
      const y = TableNode.toMarkdown(b.children[columnIndex]);
      return x.localeCompare(y);
    });
    if (!asc) {
      children = children.reverse();
    }
    this.__mdastNode.children = [this.__mdastNode.children[0], ...children];
  }

  addRowToBottom(): void {
    this.insertRowAt(this.getRowCount());
  }

  addColumnToRight(): void {
    this.insertColumnAt(this.getColCount());
  }

  setColumnAlign(colIndex: number, align: Mdast.AlignType) {
    const table = this.__mdastNode;
    if (table.align == null) {
      table.align = [];
    }
    table.align[colIndex] = align;
  }

  /**
   * Focuses the table cell at the specified coordinates. Pass `undefined` to
   * remove the focus.
   */
  select(coords?: [colIndex: number, rowIndex: number]): void {
    this.focusEmitter.publish(coords ?? [0, 0]);
  }
}

/**
 * Creates a {@link TableNode}. Use this instead of the constructor to follow the
 * Lexical conventions.
 *
 * @param mdastNode - The mdast node to create the {@link TableNode} from.
 * @group Table
 */
export function $createTableNode(mdastNode: Mdast.Table): TableNode {
  return new TableNode(mdastNode);
}

/**
 * Converts an HTML table element into a {@link TableNode}. This function is used
 * to transform a DOM table element into a format that can be used by Lexical.
 * It extracts the rows and cells from the table, converting them into
 * MDAST-compatible nodes.
 *
 * @param element - The HTML table element to convert.
 * @returns A {@link TableNode} containing the converted {@link TableNode}.
 * @group Table
 */
export function $convertTableElement(element: HTMLElement): TableNode {
  const rows = element.querySelectorAll("tr");
  const children = Array.from(rows).map((row) => {
    return {
      type: "tableRow",
      children: Array.from(row.querySelectorAll("td, th")).map((cell) => {
        return {
          type: "tableCell" as const,
          children: [
            {
              type: "text" as const,
              value: cell.textContent ?? "",
            },
          ],
        } satisfies Mdast.TableCell;
      }),
    } satisfies Mdast.TableRow;
  });

  return new TableNode({
    type: "table",
    children,
  });
}
