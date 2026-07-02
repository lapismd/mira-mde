import type { EditorState } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import type {
  MiraMarkdownBlockKind,
  MiraMarkdownBlockRange,
  MiraTemplateSelection,
  MiraTextRange,
} from "@mira-mde/extensions";

type MarkdownLine = {
  number: number;
  from: number;
  to: number;
  text: string;
  trimmed: string;
};

export type MiraMarkdownBlockMoveTarget =
  | MiraMarkdownBlockRange
  | {
      block: MiraMarkdownBlockRange;
      position: "before" | "after";
    };

export function collectMarkdownBlockRanges(
  state: EditorState,
): MiraMarkdownBlockRange[] {
  const lines = collectLines(state);
  const blocks: MiraMarkdownBlockRange[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index]!;
    if (!line.trimmed) {
      index += 1;
      continue;
    }

    const parsed = parseBlock(lines, index);
    blocks.push(createBlock(state, parsed.kind, lines, index, parsed.endIndex));
    index = parsed.endIndex + 1;
  }

  return blocks;
}

export function markdownBlockAt(
  state: EditorState,
  position: number,
): MiraMarkdownBlockRange | null {
  const blocks = collectMarkdownBlockRanges(state);
  return (
    blocks.find(
      (block) =>
        position >= block.from &&
        position <= Math.min(block.to + 1, state.doc.length),
    ) ?? null
  );
}

export function moveMarkdownBlockRange(
  view: EditorView,
  source: MiraMarkdownBlockRange,
  target: MiraMarkdownBlockMoveTarget,
): boolean {
  const resolvedTarget = resolveMoveTarget(target);
  if (source.id === resolvedTarget.block.id) {
    return false;
  }

  const doc = view.state.doc;
  const sourceEdit = editableBlockRange(doc, source);
  const targetEdit = editableBlockRange(doc, resolvedTarget.block);
  const insertOffset =
    resolvedTarget.position === "after" ? targetEdit.to : targetEdit.from;

  if (insertOffset >= sourceEdit.from && insertOffset <= sourceEdit.to) {
    return false;
  }

  const markdown = doc.toString();
  const sourceText = markdown.slice(source.from, source.to);
  const withoutSource =
    markdown.slice(0, sourceEdit.from) + markdown.slice(sourceEdit.to);
  const adjustedInsertOffset =
    insertOffset > sourceEdit.from
      ? insertOffset - (sourceEdit.to - sourceEdit.from)
      : insertOffset;
  const insertion = insertMarkdownBlock(
    withoutSource,
    adjustedInsertOffset,
    sourceText,
  );

  view.dispatch({
    changes: { from: 0, to: doc.length, insert: insertion.markdown },
    selection: { anchor: insertion.to },
    scrollIntoView: true,
    userEvent: "move.block",
  });
  return true;
}

export function duplicateMarkdownBlockRange(
  view: EditorView,
  block: MiraMarkdownBlockRange,
): void {
  const markdown = view.state.doc.toString();
  const editRange = editableBlockRange(view.state.doc, block);
  const source = view.state.doc.sliceString(block.from, block.to);
  const insertion = insertMarkdownBlock(markdown, editRange.to, source);

  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: insertion.markdown },
    selection: { anchor: insertion.to },
    scrollIntoView: true,
    userEvent: "input.duplicate.block",
  });
}

export function deleteMarkdownBlockRange(
  view: EditorView,
  block: MiraMarkdownBlockRange,
): void {
  const editRange = editableBlockRange(view.state.doc, block);
  view.dispatch({
    changes: { from: editRange.from, to: editRange.to, insert: "" },
    selection: { anchor: Math.min(editRange.from, view.state.doc.length) },
    scrollIntoView: true,
    userEvent: "delete.block",
  });
}

export function replaceMarkdownRange(
  view: EditorView,
  markdown: string,
  range: MiraTextRange,
  selection?: MiraTemplateSelection,
): void {
  const nextSelection = selectionForReplacement(
    range.from,
    markdown,
    selection,
  );
  view.dispatch({
    changes: { from: range.from, to: range.to, insert: markdown },
    selection: nextSelection,
    scrollIntoView: true,
  });
}

function collectLines(state: EditorState): MarkdownLine[] {
  const lines: MarkdownLine[] = [];
  for (let number = 1; number <= state.doc.lines; number += 1) {
    const line = state.doc.line(number);
    lines.push({
      number,
      from: line.from,
      to: line.to,
      text: line.text,
      trimmed: line.text.trim(),
    });
  }
  return lines;
}

function parseBlock(
  lines: MarkdownLine[],
  startIndex: number,
): { kind: MiraMarkdownBlockKind; endIndex: number } {
  const line = lines[startIndex]!;
  const next = lines[startIndex + 1];

  if (startIndex === 0 && isFrontmatterFence(line.trimmed)) {
    return {
      kind: "frontmatter",
      endIndex: findClosingFence(lines, startIndex, line.trimmed),
    };
  }

  const directiveFence = directiveFenceName(line.trimmed);
  if (directiveFence) {
    return {
      kind: "directive",
      endIndex: findDirectiveEnd(lines, startIndex, directiveFence),
    };
  }

  const fencedCode = fencedCodeMarker(line.text);
  if (fencedCode) {
    return {
      kind: "code",
      endIndex: findFencedCodeEnd(lines, startIndex, fencedCode),
    };
  }

  const mathFence = mathFenceName(line.trimmed);
  if (mathFence) {
    return {
      kind: "math",
      endIndex: findMathEnd(lines, startIndex, mathFence),
    };
  }

  if (isGridTableStart(line)) {
    return {
      kind: "grid-table",
      endIndex: consumeGridTable(lines, startIndex),
    };
  }

  if (isPipeTableStart(line, next)) {
    return { kind: "table", endIndex: consumePipeTable(lines, startIndex) };
  }

  if (isBlockquote(line)) {
    return {
      kind: "blockquote",
      endIndex: consumeBlockquote(lines, startIndex),
    };
  }

  if (isListItem(line)) {
    return { kind: "list", endIndex: consumeList(lines, startIndex) };
  }

  if (isStandaloneEmbed(line)) {
    return { kind: "embed", endIndex: startIndex };
  }

  if (isAtxHeading(line) || (next && isSetextHeadingUnderline(next))) {
    return {
      kind: "heading",
      endIndex: isAtxHeading(line) ? startIndex : startIndex + 1,
    };
  }

  if (isThematicBreak(line)) {
    return { kind: "thematic-break", endIndex: startIndex };
  }

  if (isHtmlBlockStart(line)) {
    return { kind: "html", endIndex: consumeHtmlBlock(lines, startIndex) };
  }

  return { kind: "paragraph", endIndex: consumeParagraph(lines, startIndex) };
}

function createBlock(
  state: EditorState,
  kind: MiraMarkdownBlockKind,
  lines: MarkdownLine[],
  startIndex: number,
  endIndex: number,
): MiraMarkdownBlockRange {
  const start = lines[startIndex]!;
  const end = lines[endIndex]!;
  const from = start.from;
  const to = end.to;
  const text = state.doc.sliceString(from, to);
  return {
    id: `line-${start.number}`,
    kind,
    from,
    to,
    startLine: start.number,
    endLine: end.number,
    text,
  };
}

function editableBlockRange(
  doc: EditorState["doc"],
  block: MiraMarkdownBlockRange,
): MiraTextRange {
  const endLine = doc.line(block.endLine);
  let to =
    block.endLine < doc.lines ? doc.line(block.endLine + 1).from : endLine.to;

  for (
    let lineNumber = block.endLine + 1;
    lineNumber <= doc.lines;
    lineNumber += 1
  ) {
    const line = doc.line(lineNumber);
    if (line.text.trim()) {
      break;
    }
    to = lineNumber < doc.lines ? doc.line(lineNumber + 1).from : line.to;
  }

  return {
    from: block.from,
    to,
  };
}

function insertMarkdownBlock(
  markdown: string,
  offset: number,
  blockMarkdown: string,
): { markdown: string; from: number; to: number } {
  const before = markdown.slice(0, offset);
  const after = markdown.slice(offset);
  const prefix = blockSeparatorBefore(before);
  const suffix = blockSeparatorAfter(after);
  const insert = `${prefix}${blockMarkdown.trimEnd()}${suffix}`;
  const from = offset + prefix.length;

  return {
    markdown: normalizeDocumentEnd(`${before}${insert}${after}`),
    from,
    to: from + blockMarkdown.trimEnd().length,
  };
}

function normalizeDocumentEnd(markdown: string): string {
  return markdown.replace(/\n{2,}$/u, "\n");
}

function blockSeparatorBefore(before: string): string {
  if (!before) {
    return "";
  }
  return "\n".repeat(Math.max(0, 2 - trailingNewlineCount(before)));
}

function blockSeparatorAfter(after: string): string {
  if (!after) {
    return "\n";
  }
  return "\n".repeat(Math.max(0, 2 - leadingNewlineCount(after)));
}

function trailingNewlineCount(value: string): number {
  return value.match(/\n*$/u)?.[0].length ?? 0;
}

function leadingNewlineCount(value: string): number {
  return value.match(/^\n*/u)?.[0].length ?? 0;
}

function resolveMoveTarget(target: MiraMarkdownBlockMoveTarget): {
  block: MiraMarkdownBlockRange;
  position: "before" | "after";
} {
  if ("block" in target) {
    return target;
  }
  return { block: target, position: "before" };
}

function selectionForReplacement(
  from: number,
  markdown: string,
  selection?: MiraTemplateSelection,
): { anchor: number; head?: number } | undefined {
  if (selection === undefined) {
    return undefined;
  }
  if (typeof selection === "number") {
    return { anchor: from + clampOffset(selection, markdown) };
  }
  const anchor = from + clampOffset(selection.anchor, markdown);
  const head = from + clampOffset(selection.head ?? selection.anchor, markdown);
  return { anchor, head };
}

function clampOffset(offset: number, markdown: string): number {
  return Math.max(0, Math.min(markdown.length, offset));
}

function isFrontmatterFence(trimmed: string): boolean {
  return trimmed === "---" || trimmed === "+++";
}

function findClosingFence(
  lines: MarkdownLine[],
  startIndex: number,
  fence: string,
): number {
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (lines[index]!.trimmed === fence) {
      return index;
    }
  }
  return startIndex;
}

function directiveFenceName(trimmed: string): string | null {
  const match = trimmed.match(/^(:{3,})(?:\w[\w-]*)?/u);
  return match?.[1] ?? null;
}

function findDirectiveEnd(
  lines: MarkdownLine[],
  startIndex: number,
  fence: string,
): number {
  const closePattern = new RegExp(`^${escapeRegExp(fence)}\\s*$`, "u");
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (closePattern.test(lines[index]!.trimmed)) {
      return index;
    }
  }
  return consumeParagraph(lines, startIndex);
}

function fencedCodeMarker(text: string): string | null {
  const match = text.match(/^ {0,3}(`{3,}|~{3,})/u);
  return match?.[1] ?? null;
}

function findFencedCodeEnd(
  lines: MarkdownLine[],
  startIndex: number,
  marker: string,
): number {
  const char = marker[0]!;
  const closePattern = new RegExp(
    `^ {0,3}${escapeRegExp(char)}{${marker.length},}\\s*$`,
    "u",
  );
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (closePattern.test(lines[index]!.text)) {
      return index;
    }
  }
  return lines.length - 1;
}

function mathFenceName(trimmed: string): "$$" | "\\[" | null {
  if (trimmed === "$$") {
    return "$$";
  }
  if (trimmed === "\\[") {
    return "\\[";
  }
  return null;
}

function findMathEnd(
  lines: MarkdownLine[],
  startIndex: number,
  fence: "$$" | "\\[",
): number {
  const closing = fence === "$$" ? "$$" : "\\]";
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (lines[index]!.trimmed === closing) {
      return index;
    }
  }
  return startIndex;
}

function isGridTableStart(line: MarkdownLine): boolean {
  return /^\s*\+[:>]?[=-]+/u.test(line.text);
}

function consumeGridTable(lines: MarkdownLine[], startIndex: number): number {
  let endIndex = startIndex;
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const trimmed = lines[index]!.trimmed;
    if (!trimmed || !/^[+|]/u.test(trimmed)) {
      break;
    }
    endIndex = index;
  }
  return endIndex;
}

function isPipeTableStart(
  line: MarkdownLine,
  next: MarkdownLine | undefined,
): boolean {
  return Boolean(
    next &&
    line.text.includes("|") &&
    /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/u.test(next.text),
  );
}

function consumePipeTable(lines: MarkdownLine[], startIndex: number): number {
  let endIndex = startIndex + 1;
  for (let index = startIndex + 2; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (!line.trimmed || !line.text.includes("|")) {
      break;
    }
    endIndex = index;
  }
  return endIndex;
}

function isBlockquote(line: MarkdownLine): boolean {
  return /^\s*>/u.test(line.text);
}

function consumeBlockquote(lines: MarkdownLine[], startIndex: number): number {
  let endIndex = startIndex;
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (!line.trimmed) {
      const next = lines[index + 1];
      if (next && isBlockquote(next)) {
        endIndex = index;
        continue;
      }
      break;
    }
    if (!isBlockquote(line)) {
      break;
    }
    endIndex = index;
  }
  return endIndex;
}

function isListItem(line: MarkdownLine): boolean {
  return /^(\s*)(?:[-*+]|\d+[.)])\s+/u.test(line.text);
}

function listIndent(line: MarkdownLine): number {
  return line.text.match(/^\s*/u)?.[0].length ?? 0;
}

function consumeList(lines: MarkdownLine[], startIndex: number): number {
  const baseIndent = listIndent(lines[startIndex]!);
  let endIndex = startIndex;

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (!line.trimmed) {
      const next = lines[index + 1];
      if (
        next &&
        (isListItem(next) || (next.trimmed && listIndent(next) > baseIndent))
      ) {
        endIndex = index;
        continue;
      }
      break;
    }
    if (isListItem(line) || listIndent(line) > baseIndent) {
      endIndex = index;
      continue;
    }
    break;
  }

  return endIndex;
}

function isStandaloneEmbed(line: MarkdownLine): boolean {
  return /^\s*!\[\[[^\]\r\n]+\]\]\s*$/u.test(line.text);
}

function isAtxHeading(line: MarkdownLine): boolean {
  return /^ {0,3}#{1,6}(?:\s|$)/u.test(line.text);
}

function isSetextHeadingUnderline(line: MarkdownLine): boolean {
  return /^ {0,3}(?:=+|-+)\s*$/u.test(line.text);
}

function isThematicBreak(line: MarkdownLine): boolean {
  return /^ {0,3}(?:(?:[-*_])\s*){3,}$/u.test(line.text);
}

function isHtmlBlockStart(line: MarkdownLine): boolean {
  return /^ {0,3}<\/?[A-Za-z][\w:-]*(?:\s|>|\/>)/u.test(line.text);
}

function consumeHtmlBlock(lines: MarkdownLine[], startIndex: number): number {
  let endIndex = startIndex;
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (!line.trimmed) {
      break;
    }
    endIndex = index;
  }
  return endIndex;
}

function consumeParagraph(lines: MarkdownLine[], startIndex: number): number {
  let endIndex = startIndex;
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (!line.trimmed || startsSpecialBlock(lines, index)) {
      break;
    }
    endIndex = index;
  }
  return endIndex;
}

function startsSpecialBlock(lines: MarkdownLine[], index: number): boolean {
  const line = lines[index]!;
  const next = lines[index + 1];
  return Boolean(
    directiveFenceName(line.trimmed) ||
    fencedCodeMarker(line.text) ||
    mathFenceName(line.trimmed) ||
    isGridTableStart(line) ||
    isPipeTableStart(line, next) ||
    isBlockquote(line) ||
    isListItem(line) ||
    isStandaloneEmbed(line) ||
    isAtxHeading(line) ||
    isThematicBreak(line) ||
    isHtmlBlockStart(line),
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
