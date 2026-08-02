import type { Heading, PhrasingContent, Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { slugHeadingText } from "../outline";

export type RemarkHeadingsOptions = {
  ids?: boolean;
  prefix?: string;
};

export const remarkHeadings: Plugin<[RemarkHeadingsOptions?] | [], Root> = (
  options = {},
) => {
  return (tree) => {
    const counts = new Map<string, number>();

    visit(tree, "heading", (node: Heading) => {
      const text = headingText(node.children);
      const id = options.ids
        ? uniqueHeadingId(
            `${options.prefix ?? ""}${slugHeadingText(text)}`,
            counts,
          )
        : undefined;

      node.data = {
        ...(node.data ?? {}),
        hProperties: {
          "data-heading": headingText(node.children),
          ...(id ? { id } : {}),
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

function uniqueHeadingId(value: string, counts: Map<string, number>): string {
  const count = counts.get(value) ?? 0;
  counts.set(value, count + 1);
  return count === 0 ? value : `${value}-${count}`;
}
