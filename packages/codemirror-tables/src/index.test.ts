import { describe, expect, it } from "vitest";
import { formatMarkdownTable, parseMarkdownTable } from ".";

describe("markdown table helpers", () => {
  it("parses and formats a GFM table", () => {
    const table = parseMarkdownTable("| A | B |\n| :--- | ---: |\n| x | y |");

    expect(table?.align).toEqual(["left", "right"]);
    expect(formatMarkdownTable(table!)).toContain("| :--- | ---: |");
  });
});
