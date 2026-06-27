import { LanguageDescription } from "@codemirror/language";
import type { Element, Root } from "hast";
import { toText } from "hast-util-to-text";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { defineMiraExtension, type MiraExtension } from "@mira-mde/extensions";
import Mermaid from "./mermaid.svelte";

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

      const className = code?.properties?.class;
      const classes = Array.isArray(className)
        ? className
        : typeof className === "string"
          ? className.split(/\s+/)
          : [];

      if (!classes.includes("language-mermaid")) {
        return;
      }

      parent.children[index] = {
        type: "element",
        tagName: "mermaid",
        properties: {
          value: toText(code),
        },
        children: [],
      };
    });
  };
};

export { Mermaid };
export default mermaidExtension;
