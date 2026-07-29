import { describe, expect, it } from "vitest";
import remarkGfm from "remark-gfm";
import type { Element, Root } from "hast";
import { createParser } from "../renderer/utils";
import { findElement } from "../test-utils";
import { rehypeHighlightLines } from "../rehype-highlight-lines";
import { rehypeTableSpans } from "../rehype-table-spans";
import { remarkHeadings } from "./headings";
import { remarkListCallouts } from "./list-callouts";
import { remarkMultimarkdownTable } from "./multimarkdown-table";

describe("Lapis preview parity plugins", () => {
  it("adds Lapis heading classes and data-heading text", () => {
    const parser = createParser([remarkHeadings]);
    const ast = parser("## Portable **heading**") as Root;
    const heading = findElement(ast, "h2");

    expect(heading?.properties?.class).toBe("cm-header cm-header-2");
    expect(heading?.properties?.["data-heading"]).toBe("Portable heading");
  });

  it("adds highlighted code line wrappers from fence metadata", () => {
    const parser = createParser([], [rehypeHighlightLines]);
    const ast = parser(
      ["```ts {2}", "const a = 1;", "const b = 2;", "```"].join("\n"),
    ) as Root;
    const code = findElement(ast, "code");
    const lines = findElements(code!, "span").filter((element) =>
      String(element.properties?.class ?? "").includes("code-line"),
    );

    expect(lines).toHaveLength(2);
    expect(lines[1]?.properties?.class).toContain("highlighted-code-line");
  });

  it("adds Lapis MultiMarkdown colspan and rowspan properties", () => {
    const parser = createParser(
      [remarkGfm, remarkMultimarkdownTable],
      [rehypeTableSpans],
    );
    const ast = parser(
      [
        "| Package | Role | Status |",
        "| --- | --- | --- |",
        "| combined package | | ready |",
        "| @mira-mde/core | editor controller | ready |",
        "| ^ | rendered markdown | ready |",
      ].join("\n"),
    ) as Root;
    const bodyRows = directElementChildren(findElement(ast, "tbody")!, "tr");
    const cells = findElements(findElement(ast, "tbody")!, "td");
    const cellWithColspan = cells.find(
      (cell) => cell.properties?.colspan === 2,
    );
    const cellWithRowspan = cells.find(
      (cell) => cell.properties?.rowspan === 2,
    );

    expect(
      bodyRows.map((row) => directElementChildren(row, "td").length),
    ).toEqual([2, 3, 2]);
    expect(cellWithColspan).toBeDefined();
    expect(cellWithRowspan).toBeDefined();
  });

  it("does not treat trailing empty MultiMarkdown cells as colspans", () => {
    const parser = createParser(
      [remarkGfm, remarkMultimarkdownTable],
      [rehypeTableSpans],
    );
    const ast = parser(
      [
        "| Package | Role | Status |   |",
        "| --- | --- | --- | --- |",
        "| @mira-mde/core | editor controller | ready |   |",
      ].join("\n"),
    ) as Root;
    const headerCells = directElementChildren(
      findElement(ast, "thead")!,
      "tr",
    ).flatMap((row) => directElementChildren(row, "th"));
    const bodyCells = findElements(findElement(ast, "tbody")!, "td");

    expect(headerCells).toHaveLength(4);
    expect(bodyCells).toHaveLength(4);
    expect(headerCells[2]?.properties?.colspan).toBeUndefined();
    expect(bodyCells[2]?.properties?.colspan).toBeUndefined();
  });

  it("renders Lapis default list callout markers", () => {
    const parser = createParser([remarkGfm, remarkListCallouts]);
    const ast = parser("- & Highlighted item\n- ? Question item") as Root;
    const items = findElements(ast, "li");
    const markers = findElements(ast, "span").filter((element) =>
      String(element.properties?.class ?? "").includes("lc-list-marker"),
    );

    expect(items[0]?.properties?.class).toContain("lc-list-callout");
    expect(items[0]?.properties?.["data-callout"]).toBe("&");
    expect(items[1]?.properties?.["data-callout"]).toBe("?");
    expect(
      markers.map((marker) => marker.properties?.["data-callout-char"]),
    ).toEqual(["&", "?"]);
  });

  it("renders an injected list callout catalog and can disable defaults", () => {
    const parser = createParser([
      remarkGfm,
      [
        remarkListCallouts,
        {
          callouts: [
            { char: "&", enabled: false },
            { char: "^", color: "80, 70, 220", icon: "bookmark" },
          ],
        },
      ],
    ]);
    const ast = parser("- & Plain item\n- ^ Custom item") as Root;
    const items = findElements(ast, "li");
    const marker = findElements(ast, "span").find(
      (element) => element.properties?.["data-list-callout-marker"] === "true",
    );

    expect(String(items[0]?.properties?.class ?? "")).not.toContain(
      "lc-list-callout",
    );
    expect(items[1]?.properties?.["data-callout"]).toBe("^");
    expect(items[1]?.properties?.style).toContain("80, 70, 220");
    expect(marker?.properties?.["data-callout-icon"]).toBe("bookmark");
  });
});

function findElements(node: Element | Root, tagName: string): Element[] {
  const results: Element[] = [];
  if (node.type === "element" && node.tagName === tagName) {
    results.push(node);
  }
  for (const child of node.children ?? []) {
    if (child.type === "element") {
      results.push(...findElements(child, tagName));
    }
  }
  return results;
}

function directElementChildren(node: Element, tagName: string): Element[] {
  return (node.children ?? []).filter(
    (child): child is Element =>
      child.type === "element" && child.tagName === tagName,
  );
}
