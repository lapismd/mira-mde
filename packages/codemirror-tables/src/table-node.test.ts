import { describe, expect, it } from "vitest";
import { TableNode } from "./table-node";

function parseTable(markdown: string): TableNode {
  const node = TableNode.fromMarkdown(markdown);
  expect(node).not.toBeNull();
  return node!;
}

function reparseTable(node: TableNode): TableNode {
  return parseTable(node.toMarkdown());
}

function cellText(node: TableNode, rowIndex: number, colIndex: number): string {
  const cell = node.getMdastNode().children[rowIndex]?.children[colIndex];
  return (
    cell?.children
      .map((child: any) => ("value" in child ? child.value : ""))
      .join("") ?? ""
  );
}

const sampleTable = [
  "| Package | Role | Status |",
  "| --- | --- | --- |",
  "| @mira-mde/core | editor controller | ready |",
  "| @mira-mde/preview | rendered markdown | ready |",
].join("\n");

describe("TableNode", () => {
  it("uses the Lapis table model", () => {
    const node = TableNode.fromMarkdown("| A |\n| --- |\n| B |");

    expect(node?.getRowCount()).toBe(2);
    expect(node?.getColCount()).toBe(1);
  });

  it("preserves table shape after inserting rows and columns", () => {
    const node = parseTable(sampleTable);

    node.insertRowAt(node.getRowCount());
    node.insertColumnAt(node.getColCount());
    expect(node.toMarkdown()).not.toContain("| :- |");
    expect(node.toMarkdown()).not.toContain("| - |");
    expect(node.toMarkdown()).toContain("| --- |");

    const reparsed = reparseTable(node);
    expect(reparsed.getRowCount()).toBe(4);
    expect(reparsed.getColCount()).toBe(4);
    for (const row of reparsed.getMdastNode().children) {
      expect(row.children).toHaveLength(4);
    }
    expect(cellText(reparsed, 0, 0)).toBe("Package");
    expect(cellText(reparsed, 1, 1)).toBe("editor controller");
  });

  it("preserves table shape after moving rows and columns", () => {
    const node = parseTable(sampleTable);

    node.moveRow(2, 1);
    node.moveColumn(2, 0);

    const reparsed = reparseTable(node);
    expect(reparsed.getRowCount()).toBe(3);
    expect(reparsed.getColCount()).toBe(3);
    for (const row of reparsed.getMdastNode().children) {
      expect(row.children).toHaveLength(3);
    }
    expect(cellText(reparsed, 0, 0)).toBe("Status");
    expect(cellText(reparsed, 1, 1)).toBe("@mira-mde/preview");
  });

  it("exposes MultiMarkdown spans for live-preview display without changing source", () => {
    const markdown = [
      "| MultiMarkdown | Span | Status |",
      "| :--- | :--- | ---: |",
      "| Combined cell | | ready |",
      "| Persistent row | rendered markdown | ready |",
      "| ^ | source-compatible spans | ready |",
    ].join("\n");
    const node = parseTable(markdown);
    const displayRows = node.getDisplayMdastNode().children;

    expect(node.hasSpans()).toBe(true);
    expect(displayRows[1]?.children).toHaveLength(2);
    expect(displayRows[1]?.children[0]?.data?.hProperties?.colSpan).toBe(2);
    expect(displayRows[1]?.children[0]?.data?.hProperties).toMatchObject({
      sourceRowIndex: 1,
      sourceColIndex: 0,
      displayColIndex: 0,
    });
    expect(displayRows[2]?.children).toHaveLength(3);
    expect(displayRows[2]?.children[0]?.data?.hProperties?.rowSpan).toBe(2);
    expect(displayRows[2]?.children[0]?.data?.hProperties).toMatchObject({
      sourceRowIndex: 2,
      sourceColIndex: 0,
      displayColIndex: 0,
    });
    expect(displayRows[3]?.children).toHaveLength(2);
    expect(displayRows[3]?.children[0]?.data?.hProperties).toMatchObject({
      sourceRowIndex: 3,
      sourceColIndex: 1,
      displayColIndex: 1,
    });
    expect(displayRows[3]?.children[1]?.data?.hProperties).toMatchObject({
      sourceRowIndex: 3,
      sourceColIndex: 2,
      displayColIndex: 2,
    });
    expect(cellText(node, 3, 0)).toBe("^");
    expect(node.toMarkdown()).toContain("| ^");

    const displayCell = displayRows[3]!.children[0]!;
    const coords = displayCell.data!.hProperties! as {
      sourceRowIndex: number;
      sourceColIndex: number;
    };
    node.updateCellContents(coords.sourceColIndex, coords.sourceRowIndex, [
      { type: "text", value: "edited span cell" },
    ]);
    expect(cellText(node, 3, 0)).toBe("^");
    expect(cellText(node, 3, 1)).toBe("edited span cell");
  });

  it("keeps trailing empty columns separate from MultiMarkdown colspans", () => {
    const node = parseTable(sampleTable);

    node.insertColumnAt(node.getColCount());
    node.rerender();

    const headerRow = node.getDisplayMdastNode().children[0];
    const bodyRow = node.getDisplayMdastNode().children[1];

    expect(node.hasSpans()).toBe(false);
    expect(node.getColCount()).toBe(4);
    expect(headerRow?.children).toHaveLength(4);
    expect(bodyRow?.children).toHaveLength(4);
    expect(headerRow?.children[2]?.data?.hProperties?.colSpan).toBeUndefined();
  });

  it("keeps MultiMarkdown display spans after clone and rerender", () => {
    const node = parseTable(
      [
        "| MultiMarkdown | Span | Status |",
        "| :--- | :--- | ---: |",
        "| Combined cell | | ready |",
        "| Persistent row | rendered markdown | ready |",
        "| ^ | source-compatible spans | ready |",
      ].join("\n"),
    );

    const clone = TableNode.clone(node);
    clone.rerender();

    expect(clone.hasSpans()).toBe(true);
    expect(
      clone.getDisplayMdastNode().children[1]?.children[0]?.data?.hProperties
        ?.colSpan,
    ).toBe(2);
    expect(
      clone.getDisplayMdastNode().children[2]?.children[0]?.data?.hProperties
        ?.rowSpan,
    ).toBe(2);
    expect(clone.toMarkdown()).toContain("| ^");
  });
});
