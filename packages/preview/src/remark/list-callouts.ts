import type { ListItem, Paragraph, Root, Text } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import {
  defaultMiraListCallouts,
  resolveMiraListCallouts,
  type MiraListCallout,
  type MiraResolvedListCallout,
} from "@mira-mde/extensions";

export type ListCallout = MiraResolvedListCallout;

export type RemarkListCalloutOptions = {
  callouts?: readonly MiraListCallout[];
};

export const defaultListCallouts: readonly ListCallout[] =
  defaultMiraListCallouts;

export const listCalloutMap = new Map<string, ListCallout>(
  defaultListCallouts.map((callout) => [callout.char, callout]),
);

export const listCalloutMarkerRegexp = new RegExp(
  `^\\s*(${defaultListCallouts.map((callout) => escapeRegExp(callout.char)).join("|")})\\s+`,
  "u",
);

export const remarkListCallouts: Plugin<[RemarkListCalloutOptions?], Root> = (
  options = {},
) => {
  const callouts = resolveMiraListCallouts(options.callouts);
  const calloutMap = new Map(
    callouts.map((callout) => [callout.char, callout]),
  );
  const markerRegexp = createListCalloutMarkerRegexp(callouts);

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

      const match = markerRegexp.exec(first.value);
      const marker = match?.[1];
      const callout = marker ? calloutMap.get(marker) : undefined;
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
            "data-list-callout-marker": "true",
            "data-callout-char": callout.char,
            ...(callout.icon ? { "data-callout-icon": callout.icon } : {}),
          },
          hChildren: [],
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

export function createListCalloutMarkerRegexp(
  callouts: readonly Pick<MiraListCallout, "char">[],
): RegExp {
  const markers = callouts
    .map((callout) => callout.char.trim())
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);
  return markers.length
    ? new RegExp(`^\\s*(${markers.map(escapeRegExp).join("|")})\\s+`, "u")
    : /$a/u;
}

export function escapeRegExp(value: string): string {
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
