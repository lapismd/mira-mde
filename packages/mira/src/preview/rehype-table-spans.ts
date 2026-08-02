import type { Element, Root } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

export const rehypeTableSpans: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "table") {
        return;
      }

      removeGeneratedTableSpanPadding(node);
    });
  };
};

function removeGeneratedTableSpanPadding(table: Element): void {
  const headerRow = findFirstRow(table, "thead");
  const expectedColumnCount = headerRow
    ? tableRowColumnCount(headerRow)
    : tableRowColumnCount(findFirstRow(table));

  if (expectedColumnCount <= 0) {
    return;
  }

  const activeRowspans: number[] = [];

  for (const row of tableRows(table)) {
    while (
      activeRowspanColumnCount(activeRowspans) + tableRowColumnCount(row) >
      expectedColumnCount
    ) {
      const removableCell = findLastEmptyCell(row);
      if (!removableCell) {
        break;
      }

      row.children.splice(row.children.indexOf(removableCell), 1);
    }

    applyRowspans(row, activeRowspans);
    decrementActiveRowspans(activeRowspans);
  }
}

function findFirstRow(table: Element, sectionTagName?: string): Element | null {
  if (sectionTagName) {
    const section = elementChildren(table).find(
      (child) => child.tagName === sectionTagName,
    );
    if (!section) {
      return null;
    }
    return (
      elementChildren(section).find((child) => child.tagName === "tr") ?? null
    );
  }

  return tableRows(table)[0] ?? null;
}

function tableRows(table: Element): Element[] {
  const rows: Element[] = [];

  for (const child of elementChildren(table)) {
    if (child.tagName === "tr") {
      rows.push(child);
    } else if (["thead", "tbody", "tfoot"].includes(child.tagName)) {
      rows.push(
        ...elementChildren(child).filter((row) => row.tagName === "tr"),
      );
    }
  }

  return rows;
}

function tableRowColumnCount(row: Element | null): number {
  if (!row) {
    return 0;
  }

  return tableCells(row).reduce(
    (count, cell) => count + numericProperty(cell, "colSpan", "colspan"),
    0,
  );
}

function tableCells(row: Element): Element[] {
  return elementChildren(row).filter((child) =>
    ["td", "th"].includes(child.tagName),
  );
}

function activeRowspanColumnCount(activeRowspans: readonly number[]): number {
  return activeRowspans.filter((rowspan) => rowspan > 0).length;
}

function applyRowspans(row: Element, activeRowspans: number[]): void {
  let columnIndex = 0;

  for (const cell of tableCells(row)) {
    while ((activeRowspans[columnIndex] ?? 0) > 0) {
      columnIndex += 1;
    }

    const colspan = numericProperty(cell, "colSpan", "colspan");
    const rowspan = numericProperty(cell, "rowSpan", "rowspan");

    if (rowspan > 1) {
      for (let offset = 0; offset < colspan; offset += 1) {
        activeRowspans[columnIndex + offset] = Math.max(
          activeRowspans[columnIndex + offset] ?? 0,
          rowspan,
        );
      }
    }

    columnIndex += colspan;
  }
}

function decrementActiveRowspans(activeRowspans: number[]): void {
  for (let index = 0; index < activeRowspans.length; index += 1) {
    const rowspan = activeRowspans[index] ?? 0;
    if (rowspan > 0) {
      activeRowspans[index] = rowspan - 1;
    }
  }
}

function findLastEmptyCell(row: Element): Element | null {
  const cells = tableCells(row);

  for (let index = cells.length - 1; index >= 0; index -= 1) {
    const cell = cells[index];
    if (!cell) {
      continue;
    }
    if (tableCellIsEmpty(cell)) {
      return cell;
    }
  }

  return null;
}

function tableCellIsEmpty(cell: Element): boolean {
  return !cell.children.some((child) => {
    if (child.type === "text") {
      return child.value.trim().length > 0;
    }

    return true;
  });
}

function elementChildren(node: Element): Element[] {
  return (node.children ?? []).filter(
    (child): child is Element => child.type === "element",
  );
}

function numericProperty(
  element: Element,
  camelCaseName: string,
  lowercaseName: string,
): number {
  const value =
    element.properties?.[camelCaseName] ?? element.properties?.[lowercaseName];
  const numericValue =
    typeof value === "number" ? value : Number.parseInt(String(value ?? 1), 10);

  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 1;
}
