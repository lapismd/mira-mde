import { describe, expect, it } from "vitest";
import type { Element } from "hast";
import {
  applyMermaidSvgLayout,
  codeTextContent,
  createMermaidRenderId,
  getCodeClasses,
  getMermaidSvgViewBox,
  mermaidExtension,
  parseMermaidSource,
  resetMermaidRenderIdCounter,
} from ".";

describe("mermaidExtension", () => {
  it("contributes a code language and renderer component", () => {
    const extension = mermaidExtension();

    expect(extension.codeLanguages).toHaveLength(1);
    expect(extension.components?.mermaid).toBeTruthy();
  });

  it("detects Mermaid classes from class and className props", () => {
    const code = {
      type: "element",
      tagName: "code",
      properties: {
        class: "hljs",
        className: ["language-mermaid"],
      },
      children: [],
    } satisfies Element;

    expect(getCodeClasses(code)).toContain("language-mermaid");
  });

  it("preserves highlighted code text newlines", () => {
    const code = {
      type: "element",
      tagName: "code",
      properties: {},
      children: [
        { type: "text", value: "flowchart LR\n" },
        {
          type: "element",
          tagName: "span",
          properties: {},
          children: [{ type: "text", value: "  A --> B\n" }],
        },
      ],
    } satisfies Element;

    expect(codeTextContent(code)).toBe("flowchart LR\n  A --> B\n");
  });

  it("creates stable source-offset render IDs", () => {
    resetMermaidRenderIdCounter();

    expect(createMermaidRenderId(42)).toBe("mira-mermaid-42-1");
    expect(createMermaidRenderId(42)).toBe("mira-mermaid-42-2");
    expect(createMermaidRenderId()).toBe("mira-mermaid-auto-3");
  });

  it("extracts Mermaid frontmatter config", () => {
    expect(
      parseMermaidSource("---\nconfig:\n  layout: elk\n---\nflowchart LR\n")
        .config,
    ).toEqual({
      config: {
        layout: "elk",
      },
    });
  });

  it("normalizes Mermaid SVG layout", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "640");
    svg.setAttribute("height", "320");

    expect(getMermaidSvgViewBox(svg)).toBe("0 0 640 320");
    applyMermaidSvgLayout(svg, "0 0 640 320", "inline");

    expect(svg.getAttribute("viewBox")).toBe("0 0 640 320");
    expect(svg.getAttribute("width")).toBe("640");
    expect(svg.style.maxWidth).toBe("640px");
  });
});
