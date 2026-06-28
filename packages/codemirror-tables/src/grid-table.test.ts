import { describe, expect, it } from "vitest";
import { GridTableNode } from "./grid-table";

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
});
