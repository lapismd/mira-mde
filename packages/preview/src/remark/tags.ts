import type { Root, Text } from "mdast";
import type { Plugin } from "unified";
import { splitTextNodes, type MarkdownInlineNode } from "./utils";

export const remarkTags: Plugin<[], Root> = () => {
  return (tree) =>
    splitTextNodes(tree, /(^|[\s([{])#([\p{L}\p{N}_/-]+)/gu, (match) => {
      const prefix = match[1] ?? "";
      const value = `#${match[2]}`;
      const tag = {
        type: "tag",
        value,
        data: {
          hName: "tag",
          hProperties: { value },
          hChildren: [{ type: "text", value }],
        },
      } as unknown as MarkdownInlineNode;

      return prefix
        ? ([
            { type: "text", value: prefix } as Text,
            tag,
          ] as unknown as MarkdownInlineNode)
        : tag;
    });
};
