import { tags as highlightTags, Tag } from "@lezer/highlight";
import type { InlineContext, MarkdownConfig } from "@lezer/markdown";

export const WikiLinkParser: MarkdownConfig = {
  defineNodes: [
    { name: "WikiLink", style: highlightTags.meta },
    { name: "WikiLinkBracket", style: highlightTags.bracket },
    { name: "WikiLinkPath", style: highlightTags.link },
    { name: "WikiLinkAnchor", style: highlightTags.meta },
    { name: "WikiLinkText", style: highlightTags.attributeValue },
  ],
  parseInline: [
    {
      before: "Link",
      name: "WikiLink",
      parse(context: InlineContext, next: number, position: number): number {
        if (next !== 91) {
          return -1;
        }

        const match =
          /^\[\[([^\]|#\r\n]+)(?:#([^\]|\r\n]+))?(?:\|([^\]\r\n]+))?\]\]/u.exec(
            context.slice(position, context.end),
          );
        if (!match) {
          return -1;
        }

        const fullMatch = match[0];
        const path = match[1] ?? "";
        const anchor = match[2];
        const text = match[3];
        const children = [];
        let index = position;

        children.push(context.elt("WikiLinkBracket", index, index + 2));
        index += 2;
        children.push(context.elt("WikiLinkPath", index, index + path.length));
        index += path.length;

        if (anchor) {
          children.push(
            context.elt("WikiLinkAnchor", index + 1, index + 1 + anchor.length),
          );
          index += 1 + anchor.length;
        }

        if (text) {
          children.push(
            context.elt("WikiLinkText", index + 1, index + 1 + text.length),
          );
          index += 1 + text.length;
        }

        children.push(
          context.elt("WikiLinkBracket", index, position + fullMatch.length),
        );

        return context.addElement(
          context.elt(
            "WikiLink",
            position,
            position + fullMatch.length,
            children,
          ),
        );
      },
    },
  ],
};

export const lapisTagHighlight = {
  marker: Tag.define(),
  name: Tag.define(),
};

export const TagParser: MarkdownConfig = {
  defineNodes: [
    { name: "Tag" },
    { name: "TagMarker", style: lapisTagHighlight.marker },
    { name: "TagName", style: lapisTagHighlight.name },
  ],
  parseInline: [
    {
      name: "Tag",
      parse(context: InlineContext, next: number, position: number): number {
        if (next !== 35) {
          return -1;
        }

        const match = /^#([/a-zA-Z0-9_-]+)/u.exec(
          context.slice(position, context.end),
        );
        const tagName = match?.[1];
        if (!match || !tagName) {
          return -1;
        }

        return context.addElement(
          context.elt("Tag", position, position + match[0].length, [
            context.elt("TagMarker", position, position + 1),
            context.elt("TagName", position + 1, position + 1 + tagName.length),
          ]),
        );
      },
    },
  ],
};

export const EmbedLinkParser: MarkdownConfig = {
  defineNodes: [
    { name: "EmbedLink", style: highlightTags.meta },
    { name: "EmbedLinkMarker", style: highlightTags.meta },
    { name: "EmbedLinkBracket", style: highlightTags.bracket },
    { name: "EmbedLinkPath", style: highlightTags.link },
    { name: "EmbedLinkAnchor", style: highlightTags.meta },
    { name: "EmbedLinkText", style: highlightTags.attributeValue },
  ],
  parseInline: [
    {
      before: "Image",
      name: "EmbedLink",
      parse(context: InlineContext, next: number, position: number): number {
        if (next !== 33) {
          return -1;
        }

        const match =
          /^!\[\[([^\]|#\r\n]+)(?:#([^\]|\r\n]+))?(?:\|([^\]\r\n]+))?\]\]/u.exec(
            context.slice(position, context.end),
          );
        if (!match) {
          return -1;
        }

        const fullMatch = match[0];
        const path = match[1] ?? "";
        const anchor = match[2];
        const text = match[3];
        const children = [];
        let index = position;

        children.push(context.elt("EmbedLinkMarker", index, index + 1));
        index += 1;
        children.push(context.elt("EmbedLinkBracket", index, index + 2));
        index += 2;
        children.push(context.elt("EmbedLinkPath", index, index + path.length));
        index += path.length;

        if (anchor) {
          children.push(
            context.elt(
              "EmbedLinkAnchor",
              index + 1,
              index + 1 + anchor.length,
            ),
          );
          index += 1 + anchor.length;
        }

        if (text) {
          children.push(
            context.elt("EmbedLinkText", index + 1, index + 1 + text.length),
          );
          index += 1 + text.length;
        }

        children.push(
          context.elt("EmbedLinkBracket", index, position + fullMatch.length),
        );

        return context.addElement(
          context.elt(
            "EmbedLink",
            position,
            position + fullMatch.length,
            children,
          ),
        );
      },
    },
  ],
};

export const PathLinkParser: MarkdownConfig = {
  defineNodes: [
    { name: "PathLink" },
    { name: "PathLinkMark", style: highlightTags.bracket },
    { name: "PathLinkText", style: highlightTags.link },
    { name: "PathLinkDestination", style: highlightTags.link },
  ],
  parseInline: [
    {
      before: "Link",
      name: "PathLink",
      parse(context: InlineContext, next: number, position: number): number {
        if (next !== 91) {
          return -1;
        }

        const match = matchLocalPathLink(context.slice(position, context.end));
        if (!match) {
          return -1;
        }

        const children = [];
        let index = position;
        children.push(context.elt("PathLinkMark", index, index + 1));
        index += 1;
        children.push(
          context.elt("PathLinkText", index, index + match.text.length),
        );
        index += match.text.length;
        children.push(context.elt("PathLinkMark", index, index + 2));
        index += 2;
        children.push(
          context.elt(
            "PathLinkDestination",
            index,
            index + match.destination.length,
          ),
        );
        index += match.destination.length;
        children.push(context.elt("PathLinkMark", index, index + 1));

        return context.addElement(
          context.elt(
            "PathLink",
            position,
            position + match.fullMatch.length,
            children,
          ),
        );
      },
    },
  ],
};

function hasRawSpace(value: string): boolean {
  return value.includes(" ");
}

function isUrlLikeDestination(value: string): boolean {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/)/iu.test(value);
}

function isLocalPathDestination(value: string): boolean {
  if (!hasRawSpace(value)) {
    return false;
  }
  if (value.trim() !== value || value.length === 0) {
    return false;
  }
  if (/[\n\r\t<>|]/u.test(value)) {
    return false;
  }
  if (value.includes("#") || value.includes("?")) {
    return false;
  }
  return !isUrlLikeDestination(value);
}

function matchLocalPathLink(value: string): {
  fullMatch: string;
  text: string;
  destination: string;
} | null {
  const match = /^\[([^\]\n]+)\]\(([^)\n]+)\)/u.exec(value);
  if (!match || !isLocalPathDestination(match[2] ?? "")) {
    return null;
  }

  return {
    fullMatch: match[0],
    text: match[1] ?? "",
    destination: match[2] ?? "",
  };
}
