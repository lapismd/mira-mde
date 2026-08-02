import type { RangeBoundary } from "./ranges";

export function getFencedCodeLanguage(markdown: string): string {
  const match = markdown.match(/^(```|~~~)\s*([^\s`]*)/);
  return match?.[2]?.trim() ?? "";
}

export function getFencedCodeWidgetRange(
  markdown: string,
): RangeBoundary | null {
  const opening = markdown.match(/^(```|~~~)[^\n]*(?:\n|$)/);
  if (!opening) {
    return null;
  }

  const fence = opening[1] ?? "";
  if (!fence) {
    return null;
  }
  const closingIndex = markdown.lastIndexOf(`\n${fence}`);
  if (closingIndex <= 0) {
    return {
      from: 0,
      to: markdown.length,
    };
  }

  return {
    from: 0,
    to: closingIndex + fence.length + 1,
  };
}
