import { LanguageDescription } from "@codemirror/language";
import type { Element, Root, RootContent } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import {
  defineMiraExtension,
  type MiraExtension,
} from "@lapismd/mira/extensions";
import Mermaid from "./mermaid.svelte";
import { createMermaidRenderId } from "./render-id";
export { mermaidRender } from "./renderer";

export type MermaidExtensionOptions = {
  enabled?: boolean;
};

export function mermaidExtension(
  options: MermaidExtensionOptions = {},
): MiraExtension {
  if (options.enabled === false) {
    return defineMiraExtension({ name: "mermaid-disabled" });
  }

  return defineMiraExtension({
    name: "mermaid",
    codeLanguages: [
      LanguageDescription.of({
        name: "mermaid",
        extensions: ["mermaid"],
        async load() {
          const language = await import("codemirror-lang-mermaid");
          return language.mermaid();
        },
      }),
    ],
    rehypePlugins: [rehypeMermaid],
    components: {
      mermaid: Mermaid,
    },
  });
}

export const rehypeMermaid: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "element", (node: Element, index, parent: any) => {
      if (
        node.tagName !== "pre" ||
        typeof index !== "number" ||
        !parent?.children
      ) {
        return;
      }

      const code = node.children.find(
        (child): child is Element =>
          child.type === "element" && child.tagName === "code",
      );
      if (!code) {
        return;
      }

      const classes = getCodeClasses(code);

      if (!classes.includes("language-mermaid")) {
        return;
      }

      parent.children[index] = {
        type: "element",
        tagName: "mermaid",
        properties: {
          value: codeTextContent(code),
          diagram: codeTextContent(code),
          sourceOffset:
            code.position?.start.offset ?? node.position?.start.offset,
          "data-source-offset":
            code.position?.start.offset ?? node.position?.start.offset,
          id: createMermaidRenderId(
            code.position?.start.offset ?? node.position?.start.offset,
          ),
        },
        children: [],
      };
    });
  };
};

export function getCodeClasses(code: Element): string[] {
  const classValue = code.properties?.class;
  const classNameValue = code.properties?.className;
  return [classValue, classNameValue]
    .flatMap((value) => {
      if (Array.isArray(value)) {
        return value.map(String);
      }
      if (typeof value === "string") {
        return value.split(/\s+/);
      }
      return [];
    })
    .filter(Boolean);
}

export function codeTextContent(node: Element | RootContent): string {
  if (node.type === "text") {
    return node.value;
  }
  if (node.type !== "element") {
    return "";
  }
  return node.children.map((child) => codeTextContent(child)).join("");
}

export { Mermaid };
export { applyMermaidSvgLayout, getMermaidSvgViewBox } from "./svg-layout";
export { parseMermaidSource } from "./frontmatter";
export {
  createMermaidRenderId,
  resetMermaidRenderIdCounter,
} from "./render-id";
export default mermaidExtension;
