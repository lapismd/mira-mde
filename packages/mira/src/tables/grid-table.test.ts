import { describe, expect, it } from "vitest";
import { GridTableNode } from "./grid-table";

function parseGridTable(markdown: string): GridTableNode {
  const node = GridTableNode.fromMarkdown(markdown);
  expect(node).not.toBeNull();
  return node!;
}

function reparseGridTable(node: GridTableNode): GridTableNode {
  return parseGridTable(node.toMarkdown());
}

function gridCellContent(
  node: GridTableNode,
  rowIndex: number,
  colIndex: number,
): string {
  return node.grid[rowIndex]?.[colIndex]?.cell.content ?? "";
}

const sampleGridTable = [
  "+----------------------+-------------------------+",
  "| Feature              | Behavior                |",
  "+======================+=========================+",
  "| Row and column menus | Kebab dropdown actions  |",
  "+----------------------+-------------------------+",
  "| Drag handles         | Reorder rows/columns    |",
  "+----------------------+-------------------------+",
  "| Source toggle        | Edit raw Markdown       |",
  "+----------------------+-------------------------+",
].join("\n");

const adobeOverviewGridTable = [
  "+-------------------+------+",
  "| Table Headings    | Here |",
  "+--------+----------+------+",
  "| Sub    | Headings | Too  |",
  "+========+=================+",
  "| cell   | column spanning |",
  "| spans  +---------:+------+",
  "| rows   |   normal | cell |",
  "+---v----+:---------------:+",
  "|        | cells can be    |",
  "|        | *formatted*     |",
  "|        | **paragraphs**  |",
  "|        | ```             |",
  "| multi  | and contain     |",
  "| line   | blocks          |",
  "| cells  | ```             |",
  "+========+=========:+======+",
  "| footer |    cells |      |",
  "+--------+----------+------+",
].join("\n");

const horizontalAlignmentExamples = [
  { align: "justify", markdown: ["+>-----<+", "| A b C |", "+-------+"] },
  { align: "center", markdown: ["+:-----:+", "|  ABC  |", "+-------+"] },
  { align: "left", markdown: ["+:------+", "| ABC   |", "+------+"] },
  { align: "right", markdown: ["+------:+", "|   ABC |", "+------+"] },
] as const;

const verticalAlignmentExamples = [
  {
    markdown: [
      "+---^---+",
      "| Larum |",
      "| Ipsum |",
      "|       |",
      "|       |",
      "+-------+",
    ],
    valign: "top",
  },
  {
    markdown: [
      "+---x---+",
      "|       |",
      "| Larum |",
      "| Ipsum |",
      "|       |",
      "+-------+",
    ],
    valign: "middle",
  },
  {
    markdown: [
      "+---v---+",
      "|       |",
      "|       |",
      "| Larum |",
      "| Ipsum |",
      "+-------+",
    ],
    valign: "bottom",
  },
] as const;

describe("GridTableNode", () => {
  it("uses the Lapis grid table model", () => {
    const node = GridTableNode.fromMarkdown(
      [
        "+---------+----------+",
        "| Feature | Behavior |",
        "+=========+==========+",
        "| Handles | Actions  |",
        "+---------+----------+",
      ].join("\n"),
    );

    expect(node).not.toBeNull();
    expect(node?.getRowCount()).toBe(2);
    expect(node?.getColCount()).toBe(2);
    expect(node?.toMarkdown()).toContain("Feature");
  });

  it("preserves table shape after inserting rows and columns", () => {
    const node = parseGridTable(sampleGridTable);

    node.insertRowAt(node.getRowCount());
    node.insertColumnAt(node.getColCount());

    const reparsed = reparseGridTable(node);
    expect(reparsed.getRowCount()).toBe(5);
    expect(reparsed.getColCount()).toBe(3);
    expect(gridCellContent(reparsed, 0, 0)).toBe("Feature");
    expect(gridCellContent(reparsed, 1, 1)).toBe("Kebab dropdown actions");
  });

  it("preserves table shape after moving rows and columns", () => {
    const node = parseGridTable(sampleGridTable);

    node.moveRow(2, 1);
    node.moveColumn(1, 0);

    const reparsed = reparseGridTable(node);
    expect(reparsed.getRowCount()).toBe(4);
    expect(reparsed.getColCount()).toBe(2);
    expect(gridCellContent(reparsed, 0, 0)).toBe("Behavior");
    expect(gridCellContent(reparsed, 1, 1)).toBe("Drag handles");
  });

  it("parses the Adobe grid-table overview example with merged rows and columns", () => {
    const node = parseGridTable(adobeOverviewGridTable);
    const cells = node
      .getMdastNode()
      .children.flatMap((section) =>
        section.children.flatMap((row) => row.children),
      );

    expect(node.getColCount()).toBe(3);
    expect(cells.some((cell) => cell.colSpan > 1)).toBe(true);
    expect(cells.some((cell) => cell.rowSpan > 1)).toBe(true);
    expect(cells.some((cell) => cell.content.includes("*formatted*"))).toBe(
      true,
    );
    expect(node.toMarkdown()).toContain("column spanning");
  });

  it.each(horizontalAlignmentExamples)(
    "parses Adobe horizontal $align grid-table alignment",
    ({ align, markdown }) => {
      const node = parseGridTable(markdown.join("\n"));

      expect(node.grid[0]?.[0]?.cell.align).toBe(align);
    },
  );

  it.each(verticalAlignmentExamples)(
    "parses Adobe vertical $valign grid-table alignment",
    ({ valign, markdown }) => {
      const node = parseGridTable(markdown.join("\n"));

      expect(node.grid[0]?.[0]?.cell.valign).toBe(valign);
    },
  );
});
