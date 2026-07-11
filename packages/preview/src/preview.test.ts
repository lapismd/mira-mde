import { describe, expect, it } from "vitest";
import remarkGridTables from "@adobe/remark-gridtables";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkEmoji from "remark-emoji";
import remarkGfm from "remark-gfm";
import {
  TYPE_TABLE,
  mdast2hastGridTablesHandler,
} from "@adobe/mdast-util-gridtables";
import type { Element, Root } from "hast";
import { remarkHeadings, remarkWikiLinks } from "./remark";
import { createParser } from "./renderer/utils";
import { findElement } from "./test-utils";

describe("preview exports", () => {
  it("exports built-in remark plugins", () => {
    expect(typeof remarkWikiLinks).toBe("function");
  });
});

describe("Carta markdown parity", () => {
  const dataPng =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";

  it("renders reference-style base64 embedded images", () => {
    const parser = createParser([remarkGfm]);
    const ast = parser(
      [
        "Here is my embedded image: ![Alt Text][my-image]",
        "",
        "And the document continues normally here.",
        "",
        `[my-image]: ${dataPng}`,
      ].join("\n"),
    ) as Root;
    const image = findElement(ast, "img");

    expect(image?.properties?.src).toBe(dataPng);
    expect(image?.properties?.alt).toBe("Alt Text");
    expect(JSON.stringify(ast)).toContain(
      "And the document continues normally here.",
    );
  });

  it("renders inline base64 images", () => {
    const parser = createParser([remarkGfm]);
    const ast = parser(`![Alt Text](${dataPng})`) as Root;
    const image = findElement(ast, "img");

    expect(image?.properties?.src).toBe(dataPng);
  });

  it("adds stable heading ids when enabled", () => {
    const parser = createParser([
      [remarkHeadings, { ids: true, prefix: "doc-" }],
    ]);
    const ast = parser(["# Title", "", "# Title"].join("\n")) as Root;
    const headings = ast.children.filter(
      (node): node is Element =>
        node.type === "element" && node.tagName === "h1",
    );

    expect(headings[0]?.properties?.id).toBe("doc-title");
    expect(headings[1]?.properties?.id).toBe("doc-title-1");
  });

  it("supports opt-in emoji shortcodes", () => {
    const parser = createParser([remarkEmoji]);
    const ast = parser("Ship it :rocket:") as Root;

    expect(JSON.stringify(ast)).toContain("🚀");
  });

  it("sanitizes raw HTML in safe mode while preserving data images", () => {
    const parser = createParser(
      [],
      [
        rehypeRaw,
        [
          rehypeSanitize,
          {
            ...defaultSchema,
            attributes: {
              ...defaultSchema.attributes,
              img: [...(defaultSchema.attributes?.img ?? []), "src", "alt"],
            },
            protocols: {
              ...defaultSchema.protocols,
              src: ["http", "https", "data"],
            },
          },
        ],
      ],
      { allowDangerousHtml: true },
    );
    const ast = parser(
      `<img src="${dataPng}" onerror="alert(1)" alt="ok"><script>alert(1)</script>`,
    ) as Root;
    const image = findElement(ast, "img");

    expect(image?.properties?.src).toBe(dataPng);
    expect(image?.properties?.onerror).toBeUndefined();
    expect(JSON.stringify(ast)).not.toContain("script");
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
            colSpan: 2,
            dataSourceOffset: 4,
            rowSpan: 3,
          };
        },
      ],
    );

    const ast = parser("Hello") as Root;
    const paragraph = ast.children[0] as Element;

    expect(paragraph.properties?.class).toBe("from-plugin");
    expect(paragraph.properties?.["aria-selected"]).toBe(true);
    expect(paragraph.properties?.colspan).toBe(2);
    expect(paragraph.properties?.["data-source-offset"]).toBe(4);
    expect(paragraph.properties?.rowspan).toBe(3);
    expect(paragraph.properties?.className).toBeUndefined();
    expect(paragraph.properties?.colSpan).toBeUndefined();
    expect(paragraph.properties?.rowSpan).toBeUndefined();
  });
});
