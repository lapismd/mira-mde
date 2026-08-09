import { describe, expect, it } from "vitest";
import remarkFrontmatter from "remark-frontmatter";
import type { Element, Root } from "hast";
import { createParser } from "../renderer/utils";
import {
  coerceFrontmatterValue,
  createFrontmatterPropertyManager,
  createFrontmatterReplacement,
  FrontmatterController,
  frontmatterProperties,
  mergeFrontmatterRecordProperties,
  parseFrontmatterYaml,
  removeFrontmatterRecordProperty,
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
      "lucide-hash",
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

  it("removes nested object and array properties immutably", () => {
    const source = {
      nested: { keep: true, remove: "value" },
      values: ["first", "second"],
    };

    expect(
      removeFrontmatterRecordProperty(source, ["nested", "remove"]),
    ).toEqual({
      nested: { keep: true },
      values: ["first", "second"],
    });
    expect(removeFrontmatterRecordProperty(source, ["values", 0])).toEqual({
      nested: { keep: true, remove: "value" },
      values: ["second"],
    });
    expect(source.nested.remove).toBe("value");
  });

  it("merges pasted properties into a portable parent record", () => {
    const source = {
      nested: { keep: true },
      title: "Demo",
    };

    expect(
      mergeFrontmatterRecordProperties(source, ["nested"], {
        owner: "[[Ada]]",
        status: "ready",
      }),
    ).toEqual({
      nested: {
        keep: true,
        owner: "[[Ada]]",
        status: "ready",
      },
      title: "Demo",
    });
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

  it("creates a property manager that resolves widgets and setType", () => {
    const manager = createFrontmatterPropertyManager({
      types: {
        status: {
          type: "workflow-state",
          label: "Workflow",
          icon: "lucide-workflow",
          fallbackKind: "text",
        },
      },
      widgets: [
        {
          type: "workflow-state",
          fallbackKind: "text",
          validate: (value) => typeof value === "string",
        },
      ],
    });

    expect(manager.resolveType("status", "status", "draft")).toBe(
      "workflow-state",
    );
    expect(manager.resolveWidget("workflow-state")?.label).toBeUndefined();
    expect(manager.typeOptions().some((option) => option.type === "text")).toBe(
      true,
    );

    manager.setType("priority", "number");
    expect(manager.resolveType("priority", "priority", "1")).toBe("number");
  });

  it("commits controller record mutations through onRecordChange", async () => {
    const commits: Array<Record<string, unknown>> = [];
    const controller = new FrontmatterController({
      record: { title: "Demo", count: 1 },
      onRecordChange(commit) {
        commits.push(commit.record);
      },
    });

    controller.updateProperty(["title"], "Updated");
    expect(controller.getRecord().title).toBe("Updated");
    expect(commits.at(-1)).toEqual({ title: "Updated", count: 1 });

    const added = controller.addProperty("text");
    expect(added).toBeTruthy();
    expect(Object.keys(controller.getRecord())).toContain(added);

    controller.renameProperty([added!], "subtitle");
    expect(controller.getRecord()).toHaveProperty("subtitle");
    expect(controller.getRecord()).not.toHaveProperty(added!);

    const title = controller.propertyManager
      .properties(controller.getRecord())
      .find((property) => property.key === "title");
    expect(title).toBeTruthy();
    controller.changePropertyKind(title!, "checkbox");
    expect(controller.getRecord().title).toBe(true);
    expect(commits.length).toBeGreaterThan(3);
  });

  it("splices YAML into markdown through controller document adapters", () => {
    const markdown = "---\ntitle: Demo\n---\n\nBody\n";
    let nextValue = markdown;
    const controller = new FrontmatterController({
      yaml: "title: Demo",
      getMarkdown: () => markdown,
      dataOffset: 0,
      dataOffsetEnd: 19,
      onFrontmatterChange(_yaml, value) {
        nextValue = value;
      },
    });

    controller.updateProperty(["title"], "Updated");
    expect(nextValue).toContain("title: Updated");
    expect(nextValue).toContain("Body");
  });
});
