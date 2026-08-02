import { toText } from "hast-util-to-text";
import type { Element, Root } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

export const rehypeCodeContext: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "element", (node: Element, _index, parent) => {
      if (
        node.tagName !== "code" ||
        !parent ||
        parent.type !== "element" ||
        parent.tagName !== "pre"
      ) {
        return;
      }

      node.properties ??= {};
      node.properties.code = toText(node, { whitespace: "pre" });
    });
  };
};

export default rehypeCodeContext;
