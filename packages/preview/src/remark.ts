import type { Blockquote, Paragraph, Root, Text } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

type ParentNode = {
  children?: unknown[];
};

type MarkdownInlineNode = Text & {
  data?: Record<string, unknown>;
};

export const remarkWikiLinks: Plugin<[], Root> = () => {
  return (tree) =>
    splitTextNodes(tree, /(!?)\[\[([^\]\n]+)]]/g, (match) => {
      const isEmbed = match[1] === "!";
      const [target = "", alias] = (match[2] ?? "").split("|", 2);
      const label = alias || target;

      return {
        type: isEmbed ? "embed" : "wikilink",
        value: target,
        data: {
          hName: isEmbed ? "embed" : "wikilink",
          hProperties: {
            href: target,
            label,
          },
          hChildren: [{ type: "text", value: label }],
        },
      } as unknown as MarkdownInlineNode;
    });
};

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

export const remarkCallouts: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      const first = node.children[0] as Paragraph | undefined;
      const firstText = first?.children?.[0] as Text | undefined;
      if (!first || first.type !== "paragraph" || firstText?.type !== "text") {
        return;
      }

      const match = firstText.value.match(/^\[!(\w+)]\s*(.*)$/);
      if (!match) {
        return;
      }

      const calloutType = match[1] ?? "note";
      const calloutTitle = match[2] || calloutType;

      firstText.value = calloutTitle;
      node.data = {
        ...(node.data ?? {}),
        hName: "callout",
        hProperties: {
          type: calloutType.toLowerCase(),
          title: calloutTitle,
        },
      };
    });
  };
};

export const remarkDirectivesToHast: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, (node: any) => {
      if (
        node.type !== "containerDirective" &&
        node.type !== "leafDirective" &&
        node.type !== "textDirective"
      ) {
        return;
      }

      node.data = {
        ...(node.data ?? {}),
        hName: "directive",
        hProperties: {
          ...(node.attributes ?? {}),
          "data-directive": node.name,
        },
      };
    });
  };
};

export const remarkPositionsToData: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, (node: any) => {
      if (!node.position) {
        return;
      }
      node.data = {
        ...(node.data ?? {}),
        hProperties: {
          ...(node.data?.hProperties ?? {}),
          "data-line": node.position.start.line,
          "data-offset": node.position.start.offset,
          "data-offset-end": node.position.end.offset,
        },
      };
    });
  };
};

function splitTextNodes(
  tree: Root,
  regexp: RegExp,
  createNode: (
    match: RegExpMatchArray,
  ) => MarkdownInlineNode | MarkdownInlineNode[],
): void {
  visit(tree, "text", (node: Text, index, parent: ParentNode | undefined) => {
    if (index === undefined || !parent?.children) {
      return;
    }

    const replacements: unknown[] = [];
    let lastIndex = 0;
    for (const match of node.value.matchAll(regexp)) {
      const matchIndex = match.index ?? 0;
      if (matchIndex > lastIndex) {
        replacements.push({
          type: "text",
          value: node.value.slice(lastIndex, matchIndex),
        });
      }

      replacements.push(...[createNode(match)].flat());
      lastIndex = matchIndex + match[0].length;
    }

    if (!replacements.length) {
      return;
    }

    if (lastIndex < node.value.length) {
      replacements.push({
        type: "text",
        value: node.value.slice(lastIndex),
      });
    }

    parent.children.splice(index, 1, ...replacements);
  });
}
