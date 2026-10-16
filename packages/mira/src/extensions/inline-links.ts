import type { Element, Root } from "hast";
import type { Plugin } from "unified";
import type { MiraExtension } from ".";
import { mount, unmount } from "svelte";
import {
  defaultMiraLinkIconRegistry,
  parseInlineLinkUrl,
  type MiraLinkIconRegistry,
} from "../internal/inline-links/registry";
import { inlineLinkLivePreview } from "../internal/inline-links/live-preview";

export type MiraInlineLinksOptions = { registry?: MiraLinkIconRegistry };

/** Bundled opt-in presentation. Does not change Markdown or install global state. */
export function inlineLinksExtension({
  registry = defaultMiraLinkIconRegistry,
}: MiraInlineLinksOptions = {}): MiraExtension {
  const transform: Plugin<[], Root> = () => (tree) => {
    function walk(node: Root | Element) {
      if (node.type === "element") {
        if (["code", "pre", "script", "style"].includes(node.tagName)) return;
        if (node.tagName === "a") {
          const href = node.properties.href;
          if (
            typeof href !== "string" ||
            !parseInlineLinkUrl(href) ||
            containsMedia(node) ||
            node.properties.dataMiraInlineLink ||
            node.properties["data-mira-internal-link"]
          )
            return;
          const label = textContent(node);
          const resolved = registry.resolve(href);
          const classes = node.properties.className;
          node.properties.className = [
            ...(Array.isArray(classes)
              ? classes
              : typeof classes === "string"
                ? classes.split(/\s+/u)
                : []),
            "mira-inline-link",
          ];
          node.properties.dataMiraInlineLink = "true";
          node.properties.dataMiraLinkDestination =
            label !== href || node.properties.title ? href : undefined;
          node.properties.target ??= "_blank";
          if (node.properties.target === "_blank")
            node.properties.rel = [
              ...new Set([
                ...(Array.isArray(node.properties.rel)
                  ? node.properties.rel
                  : typeof node.properties.rel === "string"
                    ? node.properties.rel.split(/\s+/u)
                    : []),
                "noopener",
                "noreferrer",
              ]),
            ];
          if (resolved?.icon)
            node.children.unshift({
              type: "element",
              tagName: "svg",
              properties: {
                className: "mira-link-site-icon",
                dataLinkSite: resolved.id,
                viewBox: resolved.icon.viewBox ?? "0 0 24 24",
                fill: "currentColor",
                ariaHidden: "true",
                focusable: "false",
              },
              children: resolved.icon.paths.map((path) => ({
                type: "element",
                tagName: "path",
                properties: { ...path },
                children: [],
              })),
            });
          return;
        }
      }
      for (const child of node.children)
        if (child.type === "element") walk(child);
    }
    walk(tree);
  };
  return {
    name: "inline-links",
    rehypePlugins: [transform],
    postProcessors: [
      (element) => {
        if (!element.matches("a.mira-inline-link[data-mira-link-destination]"))
          return;
        const anchor = element as HTMLAnchorElement;
        const host = anchor.ownerDocument.createElement("span");
        anchor.append(host);
        let disposed = false;
        let component: ReturnType<typeof mount> | undefined;
        void import("../preview/components/link-destination-tooltip.svelte").then(
          ({ default: LinkDestinationTooltip }) => {
            if (!disposed)
              component = mount(LinkDestinationTooltip, {
                target: host,
                props: { anchor },
              });
          },
        );
        return () => {
          disposed = true;
          if (component) void unmount(component);
          host.remove();
        };
      },
    ],
    codeMirror(context) {
      return context.mode === "live-preview"
        ? inlineLinkLivePreview(registry, context)
        : null;
    },
  };
}

function containsMedia(node: Element): boolean {
  return (
    ["img", "audio", "video", "svg", "picture"].includes(node.tagName) ||
    node.children.some(
      (child) => child.type === "element" && containsMedia(child),
    )
  );
}
function textContent(node: Element): string {
  return node.children
    .map((child) =>
      child.type === "text"
        ? child.value
        : child.type === "element"
          ? textContent(child)
          : "",
    )
    .join("");
}
