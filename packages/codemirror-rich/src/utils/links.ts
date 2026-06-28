import type { RangeBoundary } from "./ranges";

export function isExternalMarkdownDestination(value: string): boolean {
  const text = value.trim();
  return (
    /^((https?|ftps?|ssh):)?\/\//i.test(text) ||
    /^<((https?|ftps?|ssh):)?\/\//i.test(text)
  );
}

export function isExternalMarkdownLink(value: string): boolean {
  const text = value.trim();
  if (isExternalMarkdownDestination(text)) {
    return true;
  }

  const markdownLinkMatch = text.match(
    /^\[[^\]]*\]\(([^\s)]+)(?:\s+[^)]*)?\)$/,
  );
  return markdownLinkMatch
    ? isExternalMarkdownDestination(markdownLinkMatch[1] ?? "")
    : false;
}

export function isBareExternalAutolinkUrl(
  nodeName: string,
  parentName: string | undefined,
  source: string,
): boolean {
  return (
    nodeName === "URL" &&
    parentName !== "Link" &&
    isExternalMarkdownLink(source)
  );
}

export function getMarkdownLinkTextRange(
  source: string,
  from: number,
  to: number,
): RangeBoundary | null {
  if (/^<((https?|ftps?|ssh):)?\/\//i.test(source)) {
    return { from: from + 1, to: to - 1 };
  }
  if (/^((https?|ftps?|ssh):)?\/\//i.test(source)) {
    return { from, to };
  }

  const markdownLinkMatch = source.match(
    /^\[([^\]]*)\](?:\((?:[^)]+)\)|\[[^\]]*])?$/,
  );
  if (!markdownLinkMatch) {
    return null;
  }

  return {
    from: from + 1,
    to: from + 1 + (markdownLinkMatch[1]?.length ?? 0),
  };
}
