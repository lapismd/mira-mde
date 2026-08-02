import type { Blockquote, Paragraph, Root, Text } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

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
