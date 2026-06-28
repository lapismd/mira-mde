import { describe, expect, it } from "vitest";
import type { Root } from "hast";
import { createParser } from "../renderer/utils";
import { findElement } from "../test-utils";
import { remarkCustomChecklists } from "./custom-checklists";

describe("custom checklist rendering", () => {
  it("turns custom task markers into GFM task items with data-task", () => {
    const parser = createParser([remarkCustomChecklists]);
    const ast = parser("- [/] Custom task marker") as Root;
    const item = findElement(ast, "li");

    expect(item?.tagName).toBe("li");
    expect(item?.properties?.["data-task"]).toBe("/");
    expect(JSON.stringify(item)).not.toContain("[/]");
  });

  it("preserves data-task for standard task items", () => {
    const parser = createParser([remarkCustomChecklists]);
    const ast = parser("- [x] Done") as Root;
    const item = findElement(ast, "li");

    expect(item?.properties?.["data-task"]).toBe("x");
  });

  it("supports Lapis custom task marker characters", () => {
    const parser = createParser([remarkCustomChecklists]);
    const markers = [
      ">",
      "<",
      "?",
      "/",
      "!",
      '"',
      "-",
      "*",
      "l",
      "i",
      "S",
      "I",
      "f",
      "k",
      "u",
      "d",
      "w",
      "p",
      "c",
      "b",
    ];
    const ast = parser(
      markers.map((marker) => `- [${marker}] ${marker} task`).join("\n"),
    ) as Root;
    const serialized = JSON.stringify(ast);

    for (const marker of markers) {
      expect(serialized).toContain(`"data-task":${JSON.stringify(marker)}`);
      expect(serialized).not.toContain(`[${marker}]`);
    }
  });
});
