import type { Root, Table, TableCell, TableRow } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

export type MultiMarkdownTableOptions = {
  colspanMarkers?: string[];
  rowspanMarker?: string;
  trimWhitespace?: boolean;
};

type SpanOptions = Required<MultiMarkdownTableOptions>;

export const remarkMultimarkdownTable: Plugin<
  [MultiMarkdownTableOptions?],
  Root
> = (options = {}) => {
  const spanOptions: SpanOptions = {
    colspanMarkers: options.colspanMarkers ?? ["", "|"],
    rowspanMarker: options.rowspanMarker ?? "^",
    trimWhitespace: options.trimWhitespace ?? true,
  };

  return (tree) => {
    visit(tree, "table", (node: Table) => {
      if (!node.children || node.children.length < 2) {
        return;
      }

      node.children = processTableSpans(node.children, spanOptions);
    });
  };
};

function processTableSpans(
  rows: readonly TableRow[],
  options: SpanOptions,
): TableRow[] {
  const grid: Array<Array<TableCell | null | undefined>> = rows.map(() => []);
  const cellSpans = new Map<string, { rowspan: number; colspan: number }>();
  const columnCount = Math.max(1, rows[0]?.children?.length ?? 1);

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

      const cellText = tableCellText(cell, options.trimWhitespace);

      if (cellText === options.rowspanMarker) {
        extendRowspan(grid, cellSpans, rowIndex, colIndex);
        colIndex += 1;
        continue;
      }

      let { colspan, nextCellIndex } = getColspan(
        originalCells,
        cellIndex,
        options,
      );

      if (colIndex >= columnCount) {
        cellIndex = nextCellIndex - 1;
        continue;
      }

      colspan = Math.min(colspan, columnCount - colIndex);

      grid[rowIndex]![colIndex] = cell;
      cellSpans.set(`${rowIndex},${colIndex}`, { rowspan: 1, colspan });

      for (let offset = 1; offset < colspan; offset += 1) {
        grid[rowIndex]![colIndex + offset] = cell;
      }

      cellIndex = nextCellIndex - 1;
      colIndex += colspan;
    }
  }

  return rows.map((row, rowIndex) => {
    const seenCells = new Set<TableCell>();
    const children: TableCell[] = [];

    for (let colIndex = 0; colIndex < columnCount; colIndex += 1) {
      const cell = grid[rowIndex]?.[colIndex];
      if (!cell || seenCells.has(cell)) {
        continue;
      }

      seenCells.add(cell);
      const spanInfo = cellSpans.get(`${rowIndex},${colIndex}`);
      if (!spanInfo) {
        continue;
      }

      const nextCell: TableCell = {
        ...cell,
        data: {
          ...(cell.data ?? {}),
          hProperties: {
            ...(cell.data?.hProperties ?? {}),
          },
        },
      };

      if (spanInfo.colspan > 1) {
        nextCell.data!.hProperties!.colSpan = spanInfo.colspan;
      }
      if (spanInfo.rowspan > 1) {
        nextCell.data!.hProperties!.rowSpan = spanInfo.rowspan;
      }

      children.push(nextCell);
    }

    return {
      ...row,
      children,
    };
  });
}

function extendRowspan(
  grid: Array<Array<TableCell | null | undefined>>,
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

function tableCellText(cell: TableCell, trimWhitespace: boolean): string {
  const text = nodeText(cell);
  return trimWhitespace ? text.trim() : text;
}

function getColspan(
  cells: readonly TableCell[],
  cellIndex: number,
  options: SpanOptions,
): { colspan: number; nextCellIndex: number } {
  let nextCellIndex = cellIndex + 1;
  let markerCount = 0;

  while (nextCellIndex < cells.length) {
    const nextCell = cells[nextCellIndex];
    if (
      !nextCell ||
      !options.colspanMarkers.includes(
        tableCellText(nextCell, options.trimWhitespace),
      )
    ) {
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

function nodeText(node: unknown): string {
  if (!node || typeof node !== "object") {
    return "";
  }

  if ("value" in node && typeof node.value === "string") {
    return node.value;
  }

  if ("children" in node && Array.isArray(node.children)) {
    return node.children.map((child) => nodeText(child)).join("");
  }

  return "";
}
