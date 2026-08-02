import type { Root, Text } from "mdast";
import { visit } from "unist-util-visit";

type ParentNode = {
  children?: unknown[];
};

export type MarkdownInlineNode = Text & {
  data?: Record<string, unknown>;
};

export function hasRawSpace(value: string): boolean {
  return value.includes(" ");
}

export function isUrlLikeDestination(value: string): boolean {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value);
}

export function isExternalMarkdownDestination(value: string): boolean {
  const text = value.trim();

  return (
    /^((https?|ftps?|ssh):)?\/\//i.test(text) ||
    /^<((https?|ftps?|ssh):)?\/\//i.test(text) ||
    /^(mailto|tel):/i.test(text) ||
    /^<(mailto|tel):/i.test(text)
  );
}

export function isImageDataUri(value: string): boolean {
  return /^data:image\/(?:png|jpe?g|gif|webp|avif);base64,[a-z0-9+/=\s]+$/i.test(
    value.trim(),
  );
}

export function isLocalPathDestination(value: string): boolean {
  if (!hasRawSpace(value)) {
    return false;
  }
  if (value.trim() !== value || value.length === 0) {
    return false;
  }
  if (/[\n\r\t<>|]/.test(value)) {
    return false;
  }
  if (value.includes("#") || value.includes("?")) {
    return false;
  }
  return !isUrlLikeDestination(value);
}

export function isImplicitLocalPathDestination(value: string): boolean {
  if (value.trim() !== value || value.length === 0) {
    return false;
  }
  if (/[\n\r\t<>|]/.test(value) || value.includes("[") || value.includes("]")) {
    return false;
  }
  if (value.includes("#") || value.includes("?")) {
    return false;
  }
  return !isUrlLikeDestination(value);
}

export function splitTextNodes(
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
