import type { Root } from "mdast";
import type { Plugin } from "unified";
import { splitTextNodes, type MarkdownInlineNode } from "./utils";

export const remarkWikiLinks: Plugin<[], Root> = () => {
  return (tree) =>
    splitTextNodes(tree, /(!?)\[\[([^\]\n]+)]]/g, (match) => {
      const isEmbed = match[1] === "!";
      const [target = "", ...details] = (match[2] ?? "").split("|");
      const alias = details.join("|") || undefined;
      const label = alias || target;

      return {
        type: isEmbed ? "embed" : "wikilink",
        value: target,
        data: {
          hName: isEmbed ? "embed" : "wikilink",
          hProperties: {
            href: target,
            id: target,
            label,
            text: label,
          },
          hChildren: isEmbed ? [] : [{ type: "text", value: label }],
        },
      } as unknown as MarkdownInlineNode;
    });
};
