import { findInlineCodeRanges, isPositionInsideRanges } from "./inline-code";
import type { RangeBoundary } from "./ranges";
import type { Text } from "@codemirror/state";
import { markdownReferenceTarget } from "./references";

export type MarkdownImageRange = RangeBoundary & {
  /** Complete preview fragment, including the definition for a reference. */
  source: string;
  referenceLabel?: string;
};

/**
 * Inline Markdown image with a parenthetical destination:
 * `![alt](url)` / `![alt](url "title")`.
 *
 * Does not match wiki embeds (`![[note]]`).
 */
const MARKDOWN_DESTINATION_IMAGE_PATTERN =
  /!\[((?:\\.|[^\]\\])*)\]\(((?:\\.|[^)\\])*)\)/gu;

/** Full, collapsed and shortcut references; rendering still requires a definition. */
const MARKDOWN_REFERENCE_IMAGE_PATTERN =
  /!\[((?:\\.|[^\]\\])*)\](?:\[([^\]]*)\])?/gu;

export function markdownImageReferenceLabel(
  markdown: string,
  documentText: string | Text = markdown,
): string | undefined {
  MARKDOWN_REFERENCE_IMAGE_PATTERN.lastIndex = 0;
  const match = MARKDOWN_REFERENCE_IMAGE_PATTERN.exec(markdown.trim());
  return match && match[0] === markdown.trim()
    ? markdownReferenceTarget(documentText, match[2] || match[1] || "")?.label
    : undefined;
}

export function isStandaloneMarkdownImageLine(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed.startsWith("![")) {
    return false;
  }

  MARKDOWN_DESTINATION_IMAGE_PATTERN.lastIndex = 0;
  const destination = MARKDOWN_DESTINATION_IMAGE_PATTERN.exec(trimmed);
  if (destination && destination[0] === trimmed && destination.index === 0) {
    return true;
  }

  MARKDOWN_REFERENCE_IMAGE_PATTERN.lastIndex = 0;
  const reference = MARKDOWN_REFERENCE_IMAGE_PATTERN.exec(trimmed);
  return Boolean(
    reference && reference[0] === trimmed && reference.index === 0,
  );
}

export function resolveMarkdownImageWidgetSource(
  imageMarkdown: string,
  documentText: string | Text,
): string | null {
  const trimmed = imageMarkdown.trim();

  MARKDOWN_DESTINATION_IMAGE_PATTERN.lastIndex = 0;
  const destination = MARKDOWN_DESTINATION_IMAGE_PATTERN.exec(trimmed);
  if (destination && destination[0] === trimmed) {
    return trimmed;
  }

  MARKDOWN_REFERENCE_IMAGE_PATTERN.lastIndex = 0;
  const reference = MARKDOWN_REFERENCE_IMAGE_PATTERN.exec(trimmed);
  if (!reference || reference[0] !== trimmed) {
    return null;
  }

  const label = reference[2] || reference[1] || "";
  const definition = markdownReferenceTarget(documentText, label);
  if (!definition) {
    return null;
  }

  return `${trimmed}\n\n${definition.definition}`;
}

export function findMarkdownImageRanges(
  text: string,
  documentText: string | Text = text,
): MarkdownImageRange[] {
  const ranges: MarkdownImageRange[] = [];
  const codeRanges = findInlineCodeRanges(text);

  MARKDOWN_DESTINATION_IMAGE_PATTERN.lastIndex = 0;
  for (const match of text.matchAll(MARKDOWN_DESTINATION_IMAGE_PATTERN)) {
    const localFrom = match.index ?? 0;
    const localTo = localFrom + match[0].length;
    if (
      isPositionInsideRanges(localFrom, codeRanges) ||
      isPositionInsideRanges(localTo - 1, codeRanges)
    ) {
      continue;
    }

    ranges.push({
      from: localFrom,
      to: localTo,
      source: match[0],
    });
  }

  MARKDOWN_REFERENCE_IMAGE_PATTERN.lastIndex = 0;
  for (const match of text.matchAll(MARKDOWN_REFERENCE_IMAGE_PATTERN)) {
    const localFrom = match.index ?? 0;
    const localTo = localFrom + match[0].length;
    if (
      isPositionInsideRanges(localFrom, codeRanges) ||
      isPositionInsideRanges(localTo - 1, codeRanges) ||
      ranges.some((range) => localFrom < range.to && localTo > range.from)
    ) {
      continue;
    }

    const resolved = resolveMarkdownImageWidgetSource(match[0], documentText);
    if (!resolved) {
      continue;
    }

    ranges.push({
      from: localFrom,
      to: localTo,
      source: resolved,
      referenceLabel: markdownImageReferenceLabel(match[0], documentText),
    });
  }

  return ranges;
}
