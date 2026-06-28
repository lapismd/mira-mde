import type { Link, Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { isExternalMarkdownDestination } from "./utils";

export const remarkExternalLinks: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "link", (node: Link) => {
      if (!isExternalMarkdownDestination(node.url)) {
        return;
      }

      const tooltip = externalLinkTooltip(node);
      node.data = {
        ...(node.data ?? {}),
        hProperties: {
          ...(node.data?.hProperties ?? {}),
          ...(tooltip ? { "data-tooltip": tooltip } : {}),
          className: "external-link",
          target: "_blank",
          rel: "noreferrer",
        },
      };
    });
  };
};

function externalLinkTooltip(node: Link): string | undefined {
  let tooltip: string | undefined = node.url;
  if (
    node.children.length === 1 &&
    node.children[0]?.type === "text" &&
    node.children[0].value === node.url
  ) {
    tooltip = undefined;
  }

  if (node.title) {
    return [node.title, tooltip || ""].filter(Boolean).join(" > ");
  }

  return tooltip;
}
