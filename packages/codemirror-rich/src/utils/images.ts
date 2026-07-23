import { findInlineCodeRanges, isPositionInsideRanges } from "./inline-code";
import type { RangeBoundary } from "./ranges";

export type MarkdownImageRange = RangeBoundary & {
  /** Markdown passed to the preview widget (destination form when possible). */
  source: string;
};

/**
 * Inline Markdown image with a parenthetical destination:
 * `![alt](url)` / `![alt](url "title")`.
 *
 * Does not match wiki embeds (`![[note]]`).
 */
const MARKDOWN_DESTINATION_IMAGE_PATTERN =
  /!\[((?:\\.|[^\]\\])*)\]\(((?:\\.|[^)\\])*)\)/gu;

/** Reference-style image: `![alt][label]`. */
const MARKDOWN_REFERENCE_IMAGE_PATTERN =
  /!\[((?:\\.|[^\]\\])*)\]\[([^\]]+)\]/gu;

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
  documentText: string,
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

  const alt = reference[1] ?? "";
  const label = reference[2] ?? "";
  const definition = findMarkdownLinkDefinition(documentText, label);
  if (!definition) {
    return null;
  }

  return definition.title
    ? `![${alt}](${definition.destination} "${definition.title}")`
    : `![${alt}](${definition.destination})`;
}

export function findMarkdownImageRanges(
  text: string,
  documentText: string = text,
): MarkdownImageRange[] {
  const ranges: MarkdownImageRange[] = [];
  const codeRanges = findInlineCodeRanges(text);

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
    });
  }

  return ranges;
}

function findMarkdownLinkDefinition(
  documentText: string,
  label: string,
): { destination: string; title: string | null } | null {
  const normalizedLabel = normalizeReferenceLabel(label);
  const definitionPattern =
    /^\s*\[([^\]]+)\]:\s*<?([^\s>]+)>?(?:\s+(?:"([^"]*)"|'([^']*)'|\(([^)]*)\)))?\s*$/gm;

  for (const match of documentText.matchAll(definitionPattern)) {
    if (normalizeReferenceLabel(match[1] ?? "") !== normalizedLabel) {
      continue;
    }
    const destination = match[2] ?? "";
    if (!destination) {
      continue;
    }
    return {
      destination,
      title: match[3] ?? match[4] ?? match[5] ?? null,
    };
  }

  return null;
}

function normalizeReferenceLabel(label: string): string {
  return label.trim().replace(/\s+/g, " ").toLowerCase();
}
