import { describe, expect, it } from "vitest";
import { formatMarkdownTable, parseMarkdownTable } from "./pipe-table";

describe("pipe table parser", () => {
  it("parses and formats GFM tables", () => {
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
});
