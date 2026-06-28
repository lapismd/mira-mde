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

      const [firstLine = "", ...remainingLines] =
        firstText.value.split(/\r?\n/);
      const match = firstLine.match(/^\[!([\w-]+)]([+-]?)[ \t]*(.*)$/);
      if (!match) {
        return;
      }

      const calloutType = (match[1] ?? "note").toLowerCase();
      const collapsible = match[2] ?? "";
      const calloutTitle = match[3]?.trim() || defaultCalloutTitle(calloutType);
      const markerOffset =
        typeof firstText.position?.start.offset === "number"
          ? firstText.position.start.offset +
            firstLine.indexOf(collapsible || "]") +
            (collapsible ? 0 : 1)
          : -1;
      const remainingText = remainingLines.join("\n");

      if (remainingText.trim()) {
        firstText.value = remainingText;
      } else {
        first.children = first.children.filter((child) => child !== firstText);
      }

      if (!first.children.length) {
        node.children = node.children.filter((child) => child !== first);
      }

      node.data = {
        ...(node.data ?? {}),
        hName: "callout",
        hProperties: {
          "data-callout": calloutType,
          "data-expand-offset": markerOffset,
          "data-expandable": (collapsible.length > 0).toString(),
          "data-expanded": (collapsible === "+").toString(),
          "data-icon": calloutIcons[calloutType] ?? "info",
          "data-type": calloutType,
          title: calloutTitle,
          type: calloutType,
        },
      };
    });
  };
};

const calloutIcons: Record<string, string> = {
  abstract: "clipboard-list",
  attention: "triangle-alert",
  bug: "bug",
  caution: "triangle-alert",
  check: "check",
  cite: "bookmark",
  danger: "zap",
  done: "check",
  error: "zap",
  example: "list",
  fail: "x",
  failure: "x",
  faq: "circle-help",
  help: "circle-help",
  hint: "flame",
  important: "flame",
  info: "info",
  missing: "x",
  note: "pencil",
  question: "circle-help",
  quote: "quote",
  success: "check",
  summary: "clipboard-list",
  tip: "flame",
  tldr: "clipboard-list",
  todo: "circle-check",
  warning: "triangle-alert",
};

function defaultCalloutTitle(type: string): string {
  return `${type.slice(0, 1).toUpperCase()}${type.slice(1)}`;
}

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

export const remarkFrontmatterToHast: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, (node: any) => {
      if (node.type !== "yaml" && node.type !== "toml") {
        return;
      }

      const frontmatterType = node.type;
      node.type = "frontmatter";
      node.data = {
        ...(node.data ?? {}),
        hName: "frontmatter",
        hProperties: {
          ...(node.data?.hProperties ?? {}),
          frontmatter: node.value ?? "",
          value: node.value ?? "",
          "data-frontmatter": frontmatterType,
        },
        hChildren: [],
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
