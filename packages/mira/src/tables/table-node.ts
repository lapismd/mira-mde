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

export type TableCellCoordinates = [rowIndex: number, colIndex: number];

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
    let k = new_index - arr.length + 1;
    while (k--) {
      arr.push(structuredClone(defaultValue));
    }
  }
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
  return arr;
}

function processMultiMarkdownSpans(table: Mdast.Table): {
  table: Mdast.Table;
  hasSpans: boolean;
} {
  const rows = table.children;
  const columnCount = Math.max(1, rows[0]?.children?.length ?? 1);
  const grid: Array<Array<Mdast.TableCell | null | undefined>> = rows.map(
    () => [],
  );
  const cellSpans = new Map<string, { rowspan: number; colspan: number }>();
  const cellCoordinates = new Map<
    string,
    {
      sourceRowIndex: number;
      sourceColIndex: number;
      displayColIndex: number;
    }
  >();
  let hasSpans = false;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const originalCells = rows[rowIndex]?.children ?? [];
    let colIndex = 0;

    for (let cellIndex = 0; cellIndex < originalCells.length; cellIndex += 1) {
      const cell = originalCells[cellIndex];
      if (!cell) {
        continue;
      }

      while (grid[rowIndex]?.[colIndex] !== undefined) {
        colIndex += 1;
      }

      const cellText = tableCellText(cell);

      if (cellText === "^") {
        hasSpans = true;
        extendRowspan(grid, cellSpans, rowIndex, colIndex);
        colIndex += 1;
        continue;
      }

      const colspanInfo = getColspan(originalCells, cellIndex);
      let { colspan } = colspanInfo;
      const { nextCellIndex } = colspanInfo;

      if (colIndex >= columnCount) {
        cellIndex = nextCellIndex - 1;
        continue;
      }

      colspan = Math.min(colspan, columnCount - colIndex);
      if (colspan > 1) {
        hasSpans = true;
      }

      grid[rowIndex]![colIndex] = cell;
      cellSpans.set(`${rowIndex},${colIndex}`, { rowspan: 1, colspan });
      cellCoordinates.set(`${rowIndex},${colIndex}`, {
        sourceRowIndex: rowIndex,
        sourceColIndex: cellIndex,
        displayColIndex: colIndex,
      });

      for (let offset = 1; offset < colspan; offset += 1) {
        grid[rowIndex]![colIndex + offset] = cell;
      }

      cellIndex = nextCellIndex - 1;
      colIndex += colspan;
    }
  }

  if (!hasSpans) {
    return { table, hasSpans: false };
  }

  return {
    hasSpans: true,
    table: {
      ...table,
      children: rows.map((row, rowIndex) => {
        const seenCells = new Set<Mdast.TableCell>();
        const children: Mdast.TableCell[] = [];

        for (let colIndex = 0; colIndex < columnCount; colIndex += 1) {
          const cell = grid[rowIndex]?.[colIndex];
          if (!cell || seenCells.has(cell)) {
            continue;
          }

          const spanInfo = cellSpans.get(`${rowIndex},${colIndex}`);
          const sourceCoordinates = cellCoordinates.get(
            `${rowIndex},${colIndex}`,
          );
          if (!spanInfo || !sourceCoordinates) {
            continue;
          }

          seenCells.add(cell);
          children.push(
            withTableSpanProperties(cell, spanInfo, sourceCoordinates),
          );
        }

        return { ...row, children };
      }),
    },
  };
}

function extendRowspan(
  grid: Array<Array<Mdast.TableCell | null | undefined>>,
  cellSpans: Map<string, { rowspan: number; colspan: number }>,
  rowIndex: number,
  colIndex: number,
): void {
  for (let checkRow = rowIndex - 1; checkRow >= 0; checkRow -= 1) {
    const spanningCell = grid[checkRow]?.[colIndex];
    if (!spanningCell) {
      continue;
    }

    const spanInfo = cellSpans.get(`${checkRow},${colIndex}`);
    if (spanInfo && checkRow + spanInfo.rowspan === rowIndex) {
      spanInfo.rowspan += 1;
      grid[rowIndex]![colIndex] = spanningCell;
      return;
    }
  }

  grid[rowIndex]![colIndex] = null;
}

function withTableSpanProperties(
  cell: Mdast.TableCell,
  spanInfo: { rowspan: number; colspan: number },
  sourceCoordinates: {
    sourceRowIndex: number;
    sourceColIndex: number;
    displayColIndex: number;
  },
): Mdast.TableCell {
  const nextCell: Mdast.TableCell = {
    ...cell,
    data: {
      ...(cell.data ?? {}),
      hProperties: {
        ...((cell.data?.hProperties as Record<string, unknown> | undefined) ??
          {}),
        ...sourceCoordinates,
      },
    },
  };

  if (spanInfo.colspan > 1) {
    nextCell.data!.hProperties!.colSpan = spanInfo.colspan;
  }
  if (spanInfo.rowspan > 1) {
    nextCell.data!.hProperties!.rowSpan = spanInfo.rowspan;
  }

  return nextCell;
}

function tableCellText(cell: Mdast.TableCell): string {
  return TableNode.toMarkdown(cell).trim();
}

function getColspan(
  cells: Mdast.TableCell[],
  cellIndex: number,
): { colspan: number; nextCellIndex: number } {
  let nextCellIndex = cellIndex + 1;
  let markerCount = 0;

  while (nextCellIndex < cells.length) {
    const nextCell = cells[nextCellIndex];
    if (!nextCell || tableCellText(nextCell) !== "") {
      break;
    }

    markerCount += 1;
    nextCellIndex += 1;
  }

  if (markerCount === 0 || nextCellIndex >= cells.length) {
    return { colspan: 1, nextCellIndex: cellIndex + 1 };
  }

  return { colspan: 1 + markerCount, nextCellIndex };
}

function normalizeGfmTableSeparators(markdown: string): string {
  const lines = markdown.split("\n");
  if (lines.length < 2) {
    return markdown;
  }

  lines[1] = lines[1].replace(/:?-+:?/g, (marker) => {
    const leftAligned = marker.startsWith(":");
    const rightAligned = marker.endsWith(":");
    const dashCount = marker.replaceAll(":", "").length;
    if (dashCount >= 3) {
      return marker;
    }

    return `${leftAligned ? ":" : ""}---${rightAligned ? ":" : ""}`;
  });

  return lines.join("\n");
}

export class TableNode {
  /** @internal */
  __mdastNode: Mdast.Table;
  /** @internal */
  __displayMdastNode: Mdast.Table;
  /** @internal */
  __hasSpans = false;
  /** @internal */
  focusEmitter = coordinatesEmitter();

  /** @internal */
  static clone(node: TableNode): TableNode {
    return new TableNode(structuredClone(node.__mdastNode), {
      table: structuredClone(node.__displayMdastNode),
      hasSpans: node.__hasSpans,
    });
  }

  static fromMarkdown(doc: string) {
    const root = fromMarkdown(doc, {
      extensions: [gfmTable()],
      mdastExtensions: [gfmTableFromMarkdown()],
    });
    if (root.children[0]?.type === "table") {
      return new TableNode(
        root.children[0],
        processMultiMarkdownSpans(root.children[0]),
      );
    }
    return null;
  }

  static toMarkdown(node: Mdast.Nodes): string {
    return normalizeGfmTableSeparators(
      toMarkdown(node, { extensions: [gfmTableToMarkdown()] }),
    );
  }

  toMarkdown() {
    return normalizeGfmTableSeparators(
      toMarkdown(this.__mdastNode, { extensions: [gfmTableToMarkdown()] }),
    );
  }

  rerender(): this {
    const next = TableNode.fromMarkdown(this.toMarkdown())!;
    this.__mdastNode = next.__mdastNode;
    this.__displayMdastNode = next.__displayMdastNode;
    this.__hasSpans = next.__hasSpans;
    return this;
  }

  /**
   * Constructs a new {@link TableNode} with the specified MDAST table node as
   * the object to edit. See
   * {@link https://github.com/micromark/micromark-extension-gfm-table | micromark/micromark-extension-gfm-table}
   * for more information on the MDAST table node.
   */
  constructor(
    mdastNode?: Mdast.Table,
    displayModel?: { table: Mdast.Table; hasSpans: boolean },
  ) {
    this.__mdastNode = mdastNode ?? { type: "table", children: [] };
    this.__displayMdastNode = displayModel?.table ?? this.__mdastNode;
    this.__hasSpans = displayModel?.hasSpans ?? false;
  }

  /** Returns the mdast node that this node is constructed from. */
  getMdastNode(): Mdast.Table {
    return this.__mdastNode;
  }

  /** Returns the table shape used for display in live-preview widgets. */
  getDisplayMdastNode(): Mdast.Table {
    return this.__displayMdastNode;
  }

  /** Returns whether the display table contains MultiMarkdown spans. */
  hasSpans(): boolean {
    return this.__hasSpans;
  }

  /** Returns source-cell coordinates covered by a display row. */
  getCellsInDisplayRow(rowIndex: number): TableCellCoordinates[] {
    return this.getCellsInDisplayRange(
      [rowIndex, 0],
      [rowIndex, this.getColCount() - 1],
    );
  }

  /** Returns source-cell coordinates covered by a display column. */
  getCellsInDisplayColumn(colIndex: number): TableCellCoordinates[] {
    return this.getCellsInDisplayRange(
      [0, colIndex],
      [this.getRowCount() - 1, colIndex],
    );
  }

  /** Returns source-cell coordinates covered by a display rectangle. */
  getCellsInDisplayRange(
    start: TableCellCoordinates,
    end: TableCellCoordinates,
  ): TableCellCoordinates[] {
    const [row1, col1] = start;
    const [row2, col2] = end;
    const minRow = Math.min(row1, row2);
    const maxRow = Math.max(row1, row2);
    const minCol = Math.min(col1, col2);
    const maxCol = Math.max(col1, col2);
    const cells: TableCellCoordinates[] = [];
    const seen = new Set<string>();

    this.__displayMdastNode.children.forEach((row, displayRowIndex) => {
      row.children.forEach((cell, displayCellIndex) => {
        const hProperties = (cell.data?.hProperties ?? {}) as Record<
          string,
          unknown
        >;
        const sourceRowIndex = Number(
          hProperties.sourceRowIndex ?? displayRowIndex,
        );
        const sourceColIndex = Number(
          hProperties.sourceColIndex ?? displayCellIndex,
        );
        const displayColIndex = Number(
          hProperties.displayColIndex ?? displayCellIndex,
        );
        const rowSpan = Number(hProperties.rowSpan ?? 1);
        const colSpan = Number(hProperties.colSpan ?? 1);
        const cellStartRow = displayRowIndex;
        const cellEndRow = displayRowIndex + rowSpan - 1;
        const cellStartCol = displayColIndex;
        const cellEndCol = displayColIndex + colSpan - 1;
        const intersects =
          cellStartRow <= maxRow &&
          cellEndRow >= minRow &&
          cellStartCol <= maxCol &&
          cellEndCol >= minCol;

        if (!intersects) {
          return;
        }

        const key = `${sourceRowIndex},${sourceColIndex}`;
        if (!seen.has(key)) {
          seen.add(key);
          cells.push([sourceRowIndex, sourceColIndex]);
        }
      });
    });

    return cells;
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
      table.align.splice(colIndex, 0, null);
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
      const [x, y] = [
        row.position?.start?.offset ?? -1,
        row.position?.end?.offset ?? -1,
      ];
      if (x !== -1 && position >= x && y !== -1 && position <= y) {
        const cells = row.children;
        for (let colIndex = 0; colIndex < cells.length; colIndex++) {
          const cell = cells[colIndex];
          const [x, y] = [
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
