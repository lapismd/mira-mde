// @ts-nocheck
import type * as Mdast from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import { gridTablesToMarkdown } from "@adobe/mdast-util-gridtables";
import { gridTablesFromMarkdown } from "./from-markdown";
import { Text } from "@codemirror/state";
import { gridTables } from "./syntax";

declare module "mdast" {
  interface RootContentMap {
    gridTable: GridTable;
    gtHead: GridTableHeader;
    gtBody: GridTableBody;
    gtFoot: GridTableFooter;
    gtRow: GridTableRow;
    gtCell: GridTableCell;
  }

  interface GridTable extends Mdast.Parent {
    type: "gridTable";
    children: Array<GridTableHeader | GridTableBody | GridTableFooter>;
  }

  interface GridTableHeader extends Mdast.Parent {
    type: "gtHead";
    children: Array<GridTableRow>;
  }

  interface GridTableBody extends Mdast.Parent {
    type: "gtBody";
    children: Array<GridTableRow>;
  }

  interface GridTableFooter extends Mdast.Parent {
    type: "gtFoot";
    children: [GridTableRow];
  }

  interface GridTableRow extends Mdast.Parent {
    type: "gtRow";
    children: Array<GridTableCell>;
  }

  type GridAlignType = "left" | "right" | "center" | "justify" | null;
  type GridVerticalAlignType = "top" | "bottom" | "middle" | null;

  interface GridTableCell extends Mdast.Parent {
    type: "gtCell";
    colSpan: number;
    rowSpan: number;
    content: string;
    align: GridAlignType;
    valign: GridVerticalAlignType;
    positions: Array<{ from: number; to: number }>;
  }
}

const EMPTY_CELL: Mdast.GridTableCell = {
  type: "gtCell",
  content: "",
  colSpan: 1,
  rowSpan: 1,
  children: [] as Mdast.PhrasingContent[],
  align: null,
  valign: null,
  positions: [],
};

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

export type RowType = {
  section: Mdast.GridTableHeader | Mdast.GridTableBody | Mdast.GridTableFooter;
  sectionIndex: number;
  row: Mdast.GridTableRow;
  rowIndex: number;
  cells: ColType[];
};

export type ColType = Omit<RowType, "cells"> & {
  cell: Mdast.GridTableCell;
  cellIndex: number;
  coords: Array<{ x: number; y: number }>;
  x: number;
  y: number;
};

export type GridType = {
  rows: RowType[];
  grid: Array<Array<ColType | null>>;
  maxCols: number;
  maxRows: number;
};

function createVirtualGrid(table: Mdast.GridTable, doc: Text): GridType {
  // Collect all rows from all sections
  const allRows: RowType[] = [];
  const rowMap: Map<Mdast.GridTableRow, RowType> = new Map();
  const cellMap: Map<Mdast.GridTableCell, ColType> = new Map();

  for (let i = 0; i < table.children.length; i++) {
    const section = table.children[i];
    for (let j = 0; j < section.children.length; j++) {
      const row = section.children[j];
      const rowType = { sectionIndex: i, section, row, rowIndex: j, cells: [] };
      rowMap.set(row, rowType);
      allRows.push(rowType);
    }
  }

  // Build a virtual grid to track cell occupancy
  const virtualGrid: Array<Array<ColType | null>> = [];

  // Initialize the virtual grid with enough space
  const maxCols = Math.max(
    ...allRows.map((row) =>
      row.row.children.reduce((sum, cell) => sum + (cell.colSpan ?? 1), 0),
    ),
  );

  for (let i = 0; i < allRows.length; i++) {
    virtualGrid[i] = new Array(maxCols).fill(null);
  }

  // Fill the virtual grid
  for (let rowIndex = 0; rowIndex < allRows.length; rowIndex++) {
    const row = allRows[rowIndex];
    let colIndex = 0;

    for (let i = 0; i < row.row.children.length; i++) {
      const cell = row.row.children[i];
      const coords: Array<{ x: number; y: number }> = [];
      cell.rowSpan ||= 1;
      cell.colSpan ||= 1;
      // Find the next available column in this row
      while (colIndex < maxCols && virtualGrid[rowIndex][colIndex] !== null) {
        colIndex++;
      }

      if (colIndex >= maxCols) {
        break; // No more space in this row
      }

      // Fill the virtual grid for this cell's span
      for (
        let r = rowIndex;
        r < Math.min(rowIndex + (cell.rowSpan ?? 1), allRows.length);
        r++
      ) {
        for (
          let c = colIndex;
          c < Math.min(colIndex + (cell.colSpan ?? 1), maxCols);
          c++
        ) {
          const colType = { ...row, cell, coords, cellIndex: i, y: r, x: c };
          virtualGrid[r][c] = colType;
          if (!cellMap.has(cell)) {
            cellMap.set(cell, colType);
            row.cells.push(colType);
          }
          coords.push({ y: r, x: c });
        }
      }

      colIndex += cell.colSpan ?? 1;
    }
  }

  return { rows: allRows, grid: virtualGrid, maxCols, maxRows: allRows.length };
}

/**
 * Finds the cell at the given coordinates (x, y) in a grid table, taking into
 * account colspan and rowspan.
 *
 * @param table - The grid table to search
 * @param x - Column index (0-based)
 * @param y - Row index (0-based)
 * @returns The cell at the given position, or null if out of bounds
 */
function getCellAtPosition(
  grid: GridType,
  x: number,
  y: number,
): ColType | null {
  if (y < 0 || y >= grid.rows.length) {
    return null;
  }

  // Return the cell at the requested position
  if (x < 0 || x >= grid.maxCols || grid.grid[y][x] === null) {
    return null;
  }

  return grid.grid[y][x];
}

function getCellAtOffset(grid: GridType, offset: number): ColType | null {
  for (let y = 0; y < grid.grid.length; y++) {
    for (let x = 0; x < grid.grid[y].length; x++) {
      const cell = grid.grid[y][x];
      if (cell) {
        if (
          cell.cell.positions.find(
            (coord) => offset >= coord.from && offset <= coord.to,
          )
        ) {
          return cell;
        }
      }
    }
  }
  return null;
}

export class GridTableNode {
  /** @internal */
  __mdastNode: Mdast.GridTable;
  __grid: GridType;
  doc: Text = Text.of([""]);

  /** @internal */
  static clone(node: GridTableNode): GridTableNode {
    return new GridTableNode(structuredClone(node.__mdastNode));
  }

  static fromMarkdown(doc: string) {
    const root = fromMarkdown(doc, {
      extensions: [gridTables],
      mdastExtensions: [gridTablesFromMarkdown()],
    });
    if (root.children[0]?.type === "gridTable") {
      const node = new GridTableNode(root.children[0]);
      node.doc = Text.of(doc.split("\n"));
      return node;
    }
    return null;
  }

  static toMarkdown(node: Mdast.Nodes): string {
    return toMarkdown(node, {
      handlers: {
        text(node, parent, context, safeOptions) {
          return node.value;
        },
      },
      extensions: [gridTablesToMarkdown()],
    });
  }

  toMarkdown() {
    return toMarkdown(this.__mdastNode, {
      handlers: {
        text(node, parent, context, safeOptions) {
          return node.value;
        },
      },
      extensions: [gridTablesToMarkdown()],
    });
  }

  rerender(): this {
    const markdown = this.toMarkdown();
    this.__mdastNode = GridTableNode.fromMarkdown(markdown)!.__mdastNode;
    this.doc = Text.of(markdown.split("\n"));
    this.__grid = createVirtualGrid(this.__mdastNode, this.doc);
    return this;
  }

  /**
   * Constructs a new {@link TableNode} with the specified MDAST table node as
   * the object to edit. See
   * {@link https://github.com/micromark/micromark-extension-gfm-table | micromark/micromark-extension-gfm-table}
   * for more information on the MDAST table node.
   */
  constructor(mdastNode?: Mdast.GridTable) {
    this.__mdastNode = mdastNode ?? { type: "gridTable", children: [] };
    this.doc = Text.of(this.toMarkdown().split("\n"));
    this.__grid = createVirtualGrid(this.__mdastNode, this.doc);
  }

  /** Returns the mdast node that this node is constructed from. */
  getMdastNode(): Mdast.GridTable {
    return this.__mdastNode;
  }

  /** @internal */
  updateCellContents(
    x: number,
    y: number,
    children: Mdast.RootContent[] | string,
  ): void {
    if (typeof children === "string") {
      const root = fromMarkdown(children, {
        extensions: [gridTables],
        mdastExtensions: [gridTablesFromMarkdown()],
      });
      this.updateCellContents(x, y, root.children);
      return;
    }

    const gridItem = getCellAtPosition(this.__grid, x, y);
    if (!gridItem) return;

    const table = this.__mdastNode;
    const section = table.children[gridItem.sectionIndex];

    const row = section.children[gridItem.rowIndex];
    const cells = row.children;
    const cell = cells[gridItem.cellIndex];
    const cellsClone = Array.from(cells);
    const cellClone = { ...cell, children };
    const rowClone = { ...row, children: cellsClone };
    cellsClone[gridItem.cellIndex] = cellClone;
    section.children[gridItem.rowIndex] = rowClone;
    this.rerender();
  }

  insertColumnAt(colIndex: number): void {
    for (let rowIndex = 0; rowIndex < this.__grid.maxRows; rowIndex++) {
      const row = this.__grid.rows[rowIndex];
      const pos = getCellAtPosition(this.__grid, colIndex, rowIndex);
      if (pos) {
        if (pos.cell.colSpan > 1) {
          pos.cell.colSpan += 1;
        } else {
          pos.row.children.splice(pos.cellIndex, 0, {
            ...structuredClone(EMPTY_CELL),
            rowSpan: pos.cell.rowSpan,
          });
        }
      } else {
        for (let i = this.__grid.maxCols - 1; i < colIndex; i++) {
          row.row.children.push(structuredClone(EMPTY_CELL));
        }
      }
    }
    this.rerender();
  }

  deleteColumnAt(colIndex: number): void {
    for (let rowIndex = 0; rowIndex < this.__grid.maxRows; rowIndex++) {
      const row = this.__grid.rows[rowIndex];
      const pos = getCellAtPosition(this.__grid, colIndex, rowIndex);
      if (pos) {
        if (pos.cell.colSpan > 1) {
          pos.cell.colSpan -= 1;
        } else {
          pos.row.children.splice(pos.cellIndex, 1);
        }
      } else {
        row.row.children.splice(colIndex);
      }
    }
    this.rerender();
  }

  duplicateColumnAt(colIndex: number): void {
    for (let rowIndex = 0; rowIndex < this.__grid.maxRows; rowIndex++) {
      const pos = getCellAtPosition(this.__grid, colIndex, rowIndex);
      if (pos) {
        pos.row.children.splice(pos.cellIndex, 0, structuredClone(pos.cell));
      }
    }
    this.rerender();
  }

  moveColumn(colIndex: number, newIndex: number): void {
    for (let rowIndex = 0; rowIndex < this.__grid.maxRows; rowIndex++) {
      const pos = getCellAtPosition(this.__grid, colIndex, rowIndex);
      const newPos = getCellAtPosition(this.__grid, newIndex, rowIndex);
      if (pos && newPos) {
        arrayMove(
          pos.row.children,
          pos.cellIndex,
          newPos.cellIndex,
          EMPTY_CELL,
        );
      }
    }
    this.rerender();
  }

  position(rowIndex: number, colIndex?: number): any {
    let element = getCellAtPosition(this.__grid, colIndex ?? 0, rowIndex);
    if (!element) {
      return null;
    }

    const cell = element.cell;
    if (cell.position) {
      const pos = structuredClone(cell.position);
      pos.start.offset = 1 + pos.start.offset!;
      pos.end.offset = pos.end.offset! - 1;
      return pos;
    }
  }

  positions(rowIndex: number, colIndex?: number): any[] {
    let cell = getCellAtPosition(this.__grid, colIndex ?? 0, rowIndex);
    if (!cell) {
      return [];
    }
    return cell.cell.positions;
  }

  coordsAt(position: number) {
    let cell = getCellAtOffset(this.__grid, position);
    if (!cell) {
      return [-1, -1];
    }
    return [cell.x, cell.y];
  }

  cellAt(
    position: number | { x: number; y: number },
    delta?: { x: number; y: number },
  ) {
    let cell: ColType | null;
    if (typeof position === "number") {
      cell = getCellAtOffset(this.__grid, position);
    } else {
      cell = getCellAtPosition(this.__grid, position.x, position.y);
    }
    return delta ? this.nextColumn(cell, delta) : cell;
  }

  nextColumn(cell: ColType | null, { x, y }: { x: number; y: number }) {
    if (!cell || (x == 0 && y === 0)) {
      return cell;
    }
    let next = getCellAtPosition(this.__grid, cell.x + x, cell.y + y);
    while (next && next.cell === cell.cell) {
      next = getCellAtPosition(this.__grid, next.x + x, next.y + y);
    }
    return next;
  }

  get lastCell() {
    return getCellAtPosition(
      this.__grid,
      this.__grid.maxCols - 1,
      this.__grid.maxRows - 1,
    );
  }

  duplicateRowAt(y: number): void {
    const cell = getCellAtPosition(this.__grid, 0, y);
    if (!cell) {
      return;
    }
    const row = this.__grid.rows[cell.rowIndex];
    const newRow = structuredClone(row.row);
    cell.section.children.splice(cell.rowIndex, 0, newRow);
    this.rerender();
  }

  getColCount() {
    return this.__grid.maxCols;
  }

  getRowCount() {
    return this.__grid.maxRows;
  }

  getRows(type?: "gtBody" | "gtHeader" | "gtFooter") {
    if (!type) {
      return this.__grid.rows;
    }
    return this.__grid.rows.filter((it) => it.section.type === type);
  }

  get grid() {
    return this.__grid.grid;
  }

  moveRow(oldIndex: number, newIndex: number): void {
    const cell = getCellAtPosition(this.__grid, 0, oldIndex);
    const newCell = getCellAtPosition(this.__grid, 0, newIndex);
    if (!cell || !newCell) {
      return;
    }

    newCell.section.children.splice(
      newCell.rowIndex,
      0,
      cell.section.children.splice(cell.rowIndex, 1)[0],
    );
    this.rerender();
  }

  sort(colIndex: number, asc: boolean = true): void {
    const sections = this.__mdastNode.children.filter(
      (section) => section.type === "gtBody",
    );
    const sortableSections = sections.length
      ? sections
      : this.__mdastNode.children;
    const direction = asc ? 1 : -1;
    for (const section of sortableSections) {
      section.children.sort((a, b) => {
        const aValue = a.children[colIndex]?.content ?? "";
        const bValue = b.children[colIndex]?.content ?? "";
        return (
          aValue.localeCompare(bValue, undefined, {
            numeric: true,
            sensitivity: "base",
          }) * direction
        );
      });
    }
    this.rerender();
  }

  insertRowAt(y: number): void {
    let cell: ColType | null = null;
    const newRow: Mdast.GridTableRow = {
      type: "gtRow",
      children: Array.from({ length: this.getColCount() }, () =>
        structuredClone(EMPTY_CELL),
      ),
    };

    const rows: Mdast.GridTableRow[] = [];
    for (let i = y; i >= 0; i--) {
      cell = getCellAtPosition(this.__grid, 0, i);
      if (cell) break;
      rows.push(structuredClone(newRow));
    }

    if (!cell) {
      return;
    }

    if (cell.y === y) {
      cell.section.children.splice(cell.rowIndex, 0, structuredClone(newRow));
    } else {
      cell.section.children.push(...rows);
    }

    this.rerender();
  }

  deleteRowAt(rowIndex: number): void {
    const cell = getCellAtPosition(this.__grid, 0, rowIndex);
    if (!cell) {
      return;
    }
    cell.section.children.splice(cell.rowIndex, 1);
    this.rerender();
  }

  addRowToBottom(): void {
    this.insertRowAt(this.getRowCount());
    this.rerender();
  }

  addColumnToRight(): void {
    this.insertColumnAt(this.getColCount());
    this.rerender();
  }

  setColumnAlign(
    coords: { x: number; y: number } | Array<{ x: number; y: number }>,
    {
      align,
      valign,
    }: { align?: Mdast.GridAlignType; valign?: Mdast.GridVerticalAlignType },
  ) {
    const cells = Array.isArray(coords) ? coords : [coords];
    cells.forEach((pos) => {
      const cell = getCellAtPosition(this.__grid, pos.x, pos.y);
      if (!cell) {
        return;
      }
      cell.cell.valign = valign ?? cell.cell.valign;
      cell.cell.align = align ?? cell.cell.align;
    });
    this.rerender();
  }
}

/**
 * Creates a {@link TableNode}. Use this instead of the constructor to follow the
 * Lexical conventions.
 *
 * @param mdastNode - The mdast node to create the {@link TableNode} from.
 * @group Table
 */
export function $createTableNode(mdastNode: Mdast.GridTable): GridTableNode {
  return new GridTableNode(mdastNode);
}
