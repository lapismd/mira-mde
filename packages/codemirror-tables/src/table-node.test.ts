import { describe, expect, it } from "vitest";
import { TableNode } from "./table-node";

describe("TableNode", () => {
  it("uses the Lapis table model", () => {
    const node = TableNode.fromMarkdown("| A |\n| --- |\n| B |");

    expect(node?.getRowCount()).toBe(2);
    expect(node?.getColCount()).toBe(1);
  });
});
