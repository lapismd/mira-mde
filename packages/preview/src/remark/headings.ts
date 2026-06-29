import type { Heading, PhrasingContent, Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

export const remarkHeadings: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "heading", (node: Heading) => {
      node.data = {
        ...(node.data ?? {}),
        hProperties: {
          "data-heading": headingText(node.children),
          ...(node.data?.hProperties ?? {}),
          className: `cm-header cm-header-${node.depth}`,
        },
      };
    });
  };
};

function headingText(children: readonly PhrasingContent[]): string {
  return children
    .map((child) => {
      if ("value" in child && typeof child.value === "string") {
        return child.value;
      }
      if ("children" in child && Array.isArray(child.children)) {
        return headingText(child.children as PhrasingContent[]);
      }
      return "";
    })
    .join("");
}
