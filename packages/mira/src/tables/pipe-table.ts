// @ts-nocheck
import { TableNode } from "./table-node";
import type { MarkdownTable } from "./types";

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
