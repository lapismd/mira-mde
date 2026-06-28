import { describe, expect, it } from "vitest";
import {
  formatMarkdownTable,
  parseMarkdownTable,
  TableNode,
} from "./index";

describe("codemirror tables", () => {
  it("parses and formats GFM tables through the public API", () => {
    const table = parseMarkdownTable(
      "| Package | Status |\n| :--- | ---: |\n| Mira | ready |",
    );

    expect(table).toEqual({
      header: ["Package", "Status"],
      align: ["left", "right"],
      rows: [["Mira", "ready"]],
    });
    expect(formatMarkdownTable(table!)).toContain("| Package | Status |");
  });

  it("uses the Lapis TableNode model", () => {
    const node = TableNode.fromMarkdown("| A |\n| --- |\n| B |");

    expect(node?.getRowCount()).toBe(2);
    expect(node?.getColCount()).toBe(1);
  });
});
