import { describe, expect, it } from "vitest";
import remarkFrontmatter from "remark-frontmatter";
import type { Element, Root } from "hast";
import { remarkWikiLinks } from "./remark";
import {
  createFrontmatterReplacement,
  frontmatterProperties,
  parseFrontmatterYaml,
  serializeFrontmatterRecord,
} from "./components/frontmatter-utils";
import { createParser } from "./renderer/utils";
import {
  remarkCallouts,
  remarkFrontmatterToHast,
  remarkPositionsToData,
} from "./remark";

describe("preview exports", () => {
  it("exports built-in remark plugins", () => {
    expect(typeof remarkWikiLinks).toBe("function");
  });
});

describe("frontmatter utilities", () => {
  it("parses, mutates, and serializes portable YAML properties", () => {
    const parsed = parseFrontmatterYaml(
      "title: Demo\npublished: true\ncount: 2\ntags:\n  - mira\n",
    );

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const yaml = serializeFrontmatterRecord({
      ...parsed.value,
      title: "Updated",
    });

    expect(yaml).toContain("title: Updated");
    expect(createFrontmatterReplacement(yaml)).toMatch(/^---\n/);
  });

  it("derives Lapis-style property types and icons", () => {
    const properties = frontmatterProperties({
      aliases: ["Mira"],
      count: 2,
      draft: false,
      nested: { child: true },
      published: "2026-06-27",
      tags: ["mira", "editor"],
      title: "Demo",
    });

    expect(properties.map((property) => [property.key, property.type])).toEqual(
      [
        ["aliases", "aliases"],
        ["count", "number"],
        ["draft", "checkbox"],
        ["nested", "object"],
        ["published", "date"],
        ["tags", "tags"],
        ["title", "text"],
      ],
    );
    expect(properties.find((property) => property.key === "tags")?.icon).toBe(
      "lucide-tags",
    );
    expect(
      properties.find((property) => property.key === "nested")?.children[0]
        ?.type,
    ).toBe("checkbox");
  });

  it("renders frontmatter as a component with source offsets", () => {
    const parser = createParser([
      remarkFrontmatter,
      remarkFrontmatterToHast,
      remarkPositionsToData,
    ]);
    const ast = parser("---\ntitle: Demo\n---\n\n# Heading") as Root;
    const frontmatter = ast.children.find(
      (node): node is Element =>
        node.type === "element" && node.tagName === "frontmatter",
    );

    expect(frontmatter?.properties?.value).toBe("title: Demo");
    expect(frontmatter?.properties?.["data-offset"]).toBe(0);
    expect(frontmatter?.properties?.["data-offset-end"]).toBe(19);
  });
});

describe("callout rendering", () => {
  it("turns Obsidian callout blockquotes into callout elements", () => {
    const parser = createParser([remarkCallouts]);
    const ast = parser(
      "> [!note] Portable package boundary\n> The editor works.",
    ) as Root;
    const callout = ast.children.find(
      (node): node is Element =>
        node.type === "element" && node.tagName === "callout",
    );

    expect(callout?.properties?.["data-callout"]).toBe("note");
    expect(callout?.properties?.["data-icon"]).toBe("pencil");
    expect(callout?.properties?.title).toBe("Portable package boundary");
    expect(JSON.stringify(callout)).not.toContain("[!note]");
  });

  it("preserves collapsible callout state", () => {
    const parser = createParser([remarkCallouts, remarkPositionsToData]);
    const ast = parser("> [!warning]- Heads up\n> Hidden.") as Root;
    const callout = ast.children.find(
      (node): node is Element =>
        node.type === "element" && node.tagName === "callout",
    );

    expect(callout?.properties?.["data-expandable"]).toBe("true");
    expect(callout?.properties?.["data-expanded"]).toBe("false");
    expect(Number(callout?.properties?.["data-expand-offset"])).toBeGreaterThan(
      0,
    );
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
