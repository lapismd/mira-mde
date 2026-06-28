import { describe, expect, it } from "vitest";
import type { Element, Root } from "hast";
import { createParser } from "../renderer/utils";
import { remarkPositionsToData } from "./hast";
import { remarkCallouts } from "./callouts";

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
