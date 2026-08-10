import { describe, expect, it } from "vitest";
import type { Root } from "hast";
import { createParser } from "../renderer/utils";
import { findElement } from "../test-utils";
import {
  isExternalMarkdownDestination,
  isImplicitLocalPathDestination,
  isLocalPathDestination,
} from "./utils";
import { remarkExternalLinks } from "./external-links";
import { remarkPathLinks } from "./pathlink";
import { remarkWikiLinks } from "./wikilink";

describe("link parity plugins", () => {
  it("marks external links with the Lapis external-link class", () => {
    const parser = createParser([remarkExternalLinks]);
    const ast = parser("[Example](https://example.com)") as Root;
    const link = findElement(ast, "a");

    expect(link?.properties?.href).toBe("https://example.com");
    expect(link?.properties?.class).toBe("external-link");
    expect(link?.properties?.target).toBe("_blank");
    expect(link?.properties?.rel).toBe("noreferrer");
  });

  it("keeps wiki and embed links on Lapis id/text properties", () => {
    const parser = createParser([remarkWikiLinks]);
    const ast = parser(
      "[[Project Plan|Plan]] and ![[Image Asset|Diagram]]",
    ) as Root;
    const wikilink = findElement(ast, "wikilink");
    const embed = findElement(ast, "embed");

    expect(wikilink?.properties?.id).toBe("Project Plan");
    expect(wikilink?.properties?.text).toBe("Plan");
    expect(wikilink?.children).toEqual([{ type: "text", value: "Plan" }]);
    expect(embed?.properties?.id).toBe("Image Asset");
    expect(embed?.properties?.text).toBe("Diagram");
    expect(embed?.children).toEqual([]);
  });

  it("preserves compound embed labels and dimensions", () => {
    const parser = createParser([remarkWikiLinks]);
    const ast = parser("![[Image Asset|Diagram|320x180]]") as Root;
    const embed = findElement(ast, "embed");

    expect(embed?.properties?.id).toBe("Image Asset");
    expect(embed?.properties?.text).toBe("Diagram|320x180");
  });

  it("parses implicit local path links as pathlink elements", () => {
    const parser = createParser([remarkPathLinks]);
    const ast = parser("[Project Plan]") as Root;
    const pathlink = findElement(ast, "pathlink");

    expect(pathlink?.properties?.id).toBe("Project Plan");
    expect(pathlink?.properties?.text).toBe("Project Plan");
  });

  it("does not consume wikilinks or embeds while parsing implicit path links", () => {
    const parser = createParser([remarkWikiLinks, remarkPathLinks]);
    const ast = parser(
      "[[Project Plan|Plan]] ![[Image Asset|Diagram]] [Project Plan]",
    ) as Root;

    expect(findElement(ast, "wikilink")?.properties?.id).toBe("Project Plan");
    expect(findElement(ast, "embed")?.properties?.id).toBe("Image Asset");
    expect(findElement(ast, "pathlink")?.properties?.id).toBe("Project Plan");
  });

  it("classifies external and local path destinations like Lapis", () => {
    expect(isExternalMarkdownDestination("https://example.com")).toBe(true);
    expect(isExternalMarkdownDestination("//example.com")).toBe(true);
    expect(isExternalMarkdownDestination("mailto:test@example.com")).toBe(true);
    expect(isExternalMarkdownDestination("tel:+15555551212")).toBe(true);
    expect(isExternalMarkdownDestination("Project Plan.md")).toBe(false);
    expect(isLocalPathDestination("Project Plan.md")).toBe(true);
    expect(isLocalPathDestination("Project.md")).toBe(false);
    expect(isImplicitLocalPathDestination("Project.md")).toBe(true);
    expect(isImplicitLocalPathDestination("https://example.com")).toBe(false);
  });
});
