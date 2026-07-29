import type { MiraTargetFragment } from "@mira-mde/extensions";

export type MiraImageDetails = {
  alt: string;
  width?: number;
  height?: number;
};

export type MiraMarkdownEmbedSelection = {
  found: boolean;
  markdown: string;
};

export function parseMiraImageDetails(
  details: string | undefined,
  fallbackAlt = "",
): MiraImageDetails {
  const value = details?.trim() ?? "";
  const segments = value.split("|");
  const possibleSize = segments.at(-1)?.trim() ?? "";
  const dimensions = parseDimensions(possibleSize);

  if (!dimensions) {
    return {
      alt: value || fallbackAlt,
    };
  }

  return {
    alt:
      segments.length > 1
        ? segments.slice(0, -1).join("|").trim()
        : fallbackAlt,
    ...dimensions,
  };
}

export function selectMarkdownEmbedFragment(
  markdown: string,
  fragment?: MiraTargetFragment,
): MiraMarkdownEmbedSelection {
  if (!fragment) {
    return { found: true, markdown };
  }

  return fragment.kind === "heading"
    ? selectHeadingSection(markdown, fragment.value)
    : selectBlock(markdown, fragment.value);
}

function parseDimensions(
  value: string,
): Pick<MiraImageDetails, "width" | "height"> | null {
  const match = /^(\d+)\s*(?:x\s*(\d+))?$/iu.exec(value);
  if (!match?.[1]) {
    return null;
  }

  const width = Number.parseInt(match[1], 10);
  const height = match[2] ? Number.parseInt(match[2], 10) : undefined;
  if (
    !Number.isFinite(width) ||
    width <= 0 ||
    (height !== undefined && height <= 0)
  ) {
    return null;
  }
  return height === undefined ? { width } : { width, height };
}

function selectHeadingSection(
  markdown: string,
  requestedHeading: string,
): MiraMarkdownEmbedSelection {
  const lines = markdown.split("\n");
  const headings = lines
    .map((line, index) => parseHeading(line, lines[index + 1], index))
    .filter((heading): heading is ParsedHeading => heading !== null);
  const normalizedRequest = normalizeHeading(requestedHeading);
  const requestedSlug = slugHeading(normalizedRequest);
  const start = headings.find(
    (heading) =>
      normalizeHeading(heading.text) === normalizedRequest ||
      slugHeading(heading.text) === requestedSlug,
  );

  if (!start) {
    return { found: false, markdown: "" };
  }

  const next = headings.find(
    (heading) => heading.line > start.line && heading.level <= start.level,
  );
  return {
    found: true,
    markdown: lines.slice(start.line, next?.line ?? lines.length).join("\n"),
  };
}

function selectBlock(
  markdown: string,
  blockId: string,
): MiraMarkdownEmbedSelection {
  const normalizedId = blockId.trim();
  if (!normalizedId) {
    return { found: false, markdown: "" };
  }

  const lines = markdown.split("\n");
  const escapedId = escapeRegExp(normalizedId);
  const marker = new RegExp(`(?:^|\\s)\\^${escapedId}\\s*$`, "u");
  const markerLine = lines.findIndex((line) => marker.test(line));
  if (markerLine === -1) {
    return { found: false, markdown: "" };
  }

  let from = markerLine;
  while (from > 0 && lines[from - 1]?.trim()) {
    from -= 1;
  }
  let to = markerLine + 1;
  while (to < lines.length && lines[to]?.trim()) {
    to += 1;
  }

  const selected = lines.slice(from, to);
  const relativeMarkerLine = markerLine - from;
  selected[relativeMarkerLine] = (selected[relativeMarkerLine] ?? "")
    .replace(marker, "")
    .trimEnd();

  return {
    found: true,
    markdown: selected
      .filter((line, index) => line || index !== relativeMarkerLine)
      .join("\n"),
  };
}

type ParsedHeading = {
  level: number;
  line: number;
  text: string;
};

function parseHeading(
  line: string,
  nextLine: string | undefined,
  index: number,
): ParsedHeading | null {
  const atx = /^ {0,3}(#{1,6})[ \t]+(.+?)(?:[ \t]+#+[ \t]*)?$/u.exec(line);
  if (atx?.[1] && atx[2]) {
    return {
      level: atx[1].length,
      line: index,
      text: atx[2],
    };
  }

  const setext = /^ {0,3}(=+|-+)[ \t]*$/u.exec(nextLine ?? "");
  if (line.trim() && setext?.[1]) {
    return {
      level: setext[1].startsWith("=") ? 1 : 2,
      line: index,
      text: line.trim(),
    };
  }
  return null;
}

function normalizeHeading(value: string): string {
  let decoded = value.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // Keep malformed percent-encoded headings usable as literal text.
  }

  return decoded
    .replace(
      /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/gu,
      (_, target, alias) => alias || target,
    )
    .replace(/\[([^\]]+)\]\([^)]+\)/gu, "$1")
    .replace(/[*_~`]/gu, "")
    .replace(/\s+/gu, " ")
    .trim()
    .toLocaleLowerCase();
}

function slugHeading(value: string): string {
  return normalizeHeading(value)
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/gu, "-")
    .replace(/-+/gu, "-");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
