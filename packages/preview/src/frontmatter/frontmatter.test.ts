import { describe, expect, it } from "vitest";
import remarkFrontmatter from "remark-frontmatter";
import type { Element, Root } from "hast";
import { createParser } from "../renderer/utils";
import {
  coerceFrontmatterValue,
  createFrontmatterReplacement,
  frontmatterProperties,
  parseFrontmatterYaml,
  resolveFrontmatterWidget,
  serializeFrontmatterRecord,
} from ".";
import { remarkFrontmatterToHast, remarkPositionsToData } from "../remark";

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

  it("applies configured frontmatter property types and widgets", () => {
    const properties = frontmatterProperties(
      {
        status: "draft",
        title: "Demo",
      },
      {
        types: {
          status: {
            type: "workflow-state",
            label: "Workflow state",
            icon: "lucide-workflow",
            fallbackKind: "text",
            defaultValue: "draft",
            normalize: (value: unknown) => String(value).toUpperCase(),
          },
        },
        widgets: [
          {
            type: "workflow-state",
            label: "Workflow state",
            icon: "lucide-workflow",
            fallbackKind: "text",
            render: () => undefined,
          },
        ],
      },
    );
    const status = properties.find((property) => property.key === "status");

    expect(status?.type).toBe("workflow-state");
    expect(status?.icon).toBe("lucide-workflow");
    expect(resolveFrontmatterWidget({ widgets: [] }, "missing")).toBeNull();
    expect(
      coerceFrontmatterValue("draft", "workflow-state", {
        widgets: [
          {
            type: "workflow-state",
            normalize: (value: unknown) => String(value).toUpperCase(),
          },
        ],
      }),
    ).toBe("DRAFT");
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
