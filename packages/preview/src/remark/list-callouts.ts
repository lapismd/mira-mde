import type { ListItem, Paragraph, Root, Text } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

export type ListCallout = {
  char: string;
  color: string;
  icon?: string;
};

export const defaultListCallouts: readonly ListCallout[] = [
  { color: "255, 214, 0", char: "&" },
  { color: "255, 145, 0", char: "?" },
  { color: "255, 23, 68", char: "!" },
  { color: "124, 77, 255", char: "~" },
  { color: "0, 184, 212", char: "@", icon: "book-open" },
  { color: "0, 200, 83", char: "$" },
  { color: "158, 158, 158", char: "%" },
];

export const listCalloutMap = new Map(
  defaultListCallouts.map((callout) => [callout.char, callout]),
);

export const listCalloutMarkerRegexp = new RegExp(
  `^\\s*(${defaultListCallouts.map((callout) => escapeRegExp(callout.char)).join("|")})\\s+`,
  "u",
);

export const remarkListCallouts: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "listItem", (node: ListItem) => {
      const paragraph = node.children[0] as Paragraph | undefined;
      const first = paragraph?.children?.[0] as Text | undefined;
      if (
        paragraph?.type !== "paragraph" ||
        first?.type !== "text" ||
        !first.value
      ) {
        return;
      }

      const match = listCalloutMarkerRegexp.exec(first.value);
      const marker = match?.[1];
      const callout = marker ? listCalloutMap.get(marker) : undefined;
      if (!match || !marker || !callout) {
        return;
      }

      const remainder = first.value.slice(match[0].length);
      const markerNode = {
        type: "listCalloutMarker",
        data: {
          hName: "span",
          hProperties: {
            className: "lc-list-marker",
            "aria-hidden": "true",
            ...(callout.icon ? { "data-icon": callout.icon } : {}),
          },
          hChildren: [{ type: "text", value: callout.char }],
        },
      } as unknown as Text;

      first.value = remainder;
      paragraph.children.splice(0, 0, markerNode);

      node.data = {
        ...(node.data ?? {}),
        hProperties: {
          ...(node.data?.hProperties ?? {}),
          className: mergeClassNames(
            node.data?.hProperties?.className,
            "lc-list-callout",
          ),
          "data-callout": callout.char,
          style: mergeStyle(
            node.data?.hProperties?.style,
            `--lc-callout-color: ${callout.color}`,
          ),
        },
      };
    });
  };
};

function escapeRegExp(value: string): string {
  return value.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}

function mergeClassNames(current: unknown, className: string): string {
  const values = Array.isArray(current)
    ? current.map(String)
    : typeof current === "string"
      ? current.split(/\s+/u)
      : [];
  if (!values.includes(className)) {
    values.push(className);
  }
  return values.filter(Boolean).join(" ");
}

function mergeStyle(current: unknown, style: string): string {
  const currentStyle = typeof current === "string" ? current.trim() : "";
  return [currentStyle, style].filter(Boolean).join("; ");
}
