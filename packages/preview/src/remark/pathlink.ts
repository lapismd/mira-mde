import type { Root } from "mdast";
import type { Plugin } from "unified";
import { isImplicitLocalPathDestination, splitTextNodes, type MarkdownInlineNode } from "./utils";

export const remarkPathLinks: Plugin<[], Root> = () => {
  return (tree) =>
    splitTextNodes(tree, /(?<!\[)\[(?!\[)([^\]\n]+)](?![\](])/g, (match) => {
      const id = match[1] ?? "";
      if (!isImplicitLocalPathDestination(id)) {
        return {
          type: "text",
          value: match[0] ?? "",
        } as unknown as MarkdownInlineNode;
      }

      return {
        type: "pathlink",
        value: id,
        data: {
          hName: "pathlink",
          hProperties: {
            href: id,
            id,
            label: id,
            text: id,
          },
          hChildren: [{ type: "text", value: id }],
        },
      } as unknown as MarkdownInlineNode;
    });
};
