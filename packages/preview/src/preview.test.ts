import { describe, expect, it } from "vitest";
import remarkGridTables from "@adobe/remark-gridtables";
import {
  TYPE_TABLE,
  mdast2hastGridTablesHandler,
} from "@adobe/mdast-util-gridtables";
import type { Element, Root } from "hast";
import { remarkWikiLinks } from "./remark";
import { createParser } from "./renderer/utils";
import { findElement } from "./test-utils";

describe("preview exports", () => {
  it("exports built-in remark plugins", () => {
    expect(typeof remarkWikiLinks).toBe("function");
  });
});

describe("grid table rendering", () => {
  it("renders Adobe grid tables through the preview pipeline", () => {
    const parser = createParser([remarkGridTables], [], {
      allowDangerousHtml: true,
      handlers: {
        [TYPE_TABLE]: mdast2hastGridTablesHandler(),
      },
    });
    const ast = parser(
      [
        "+---------+----------+",
        "| Feature | Behavior |",
        "+=========+==========+",
        "| Menus   | Actions  |",
        "+---------+----------+",
      ].join("\n"),
    ) as Root;

    expect(findElement(ast, "table")).toBeDefined();
    expect(JSON.stringify(ast)).toContain("Feature");
  });
});

describe("renderer prop normalization", () => {
  it("normalizes props added by rehype plugins", () => {
    const parser = createParser(
      [],
      [
        () => (tree) => {
          const root = tree as Root;
          const paragraph = root.children[0] as Element;
          paragraph.properties = {
            className: ["from-plugin"],
            ariaSelected: true,
            dataSourceOffset: 4,
          };
        },
      ],
    );

    const ast = parser("Hello") as Root;
    const paragraph = ast.children[0] as Element;

    expect(paragraph.properties?.class).toBe("from-plugin");
    expect(paragraph.properties?.["aria-selected"]).toBe(true);
    expect(paragraph.properties?.["data-source-offset"]).toBe(4);
    expect(paragraph.properties?.className).toBeUndefined();
  });
});
