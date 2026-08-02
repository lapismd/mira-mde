import type { EditorState } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import type {
  MiraMarkdownBlockHandle,
  MiraMarkdownBlockKind,
  MiraMarkdownBlockRange,
  MiraTemplateSelection,
  MiraTextRange,
} from "../../../extensions/index";

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

export type MiraMarkdownBlockHandleMoveTarget = {
  handle: MiraMarkdownBlockHandle;
  position: "before" | "after" | "inside";
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

export function collectMarkdownBlockHandles(
  state: EditorState,
): MiraMarkdownBlockHandle[] {
  const lines = collectLines(state);
  const blocks = collectMarkdownBlockRanges(state);
  const handles: MiraMarkdownBlockHandle[] = [];

  for (const block of blocks) {
    if (block.kind === "list") {
      continue;
    }

    if (block.kind === "heading") {
      const headingLevel = headingLevelForBlock(lines, block);
      handles.push({
        id: block.id,
        role: "heading-section",
        handleRange: block,
        affectedRange: headingLevel
          ? headingSectionRange(state, lines, block, headingLevel)
          : block,
        headingLevel: headingLevel ?? undefined,
      });
      continue;
    }

    handles.push({
      id: block.id,
      role: "block",
      handleRange: block,
      affectedRange: block,
    });
  }

  handles.push(...collectListItemHandles(state, lines));
  return handles.sort((a, b) => a.handleRange.from - b.handleRange.from);
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

export function moveMarkdownBlockHandle(
  view: EditorView,
  source: MiraMarkdownBlockHandle,
  target: MiraMarkdownBlockHandleMoveTarget,
): boolean {
  if (source.role === "list-item") {
    return moveMarkdownListItemHandle(view, source, target);
  }

  if (target.position === "inside") {
    return false;
  }

  return moveMarkdownBlockRange(view, source.affectedRange, {
    block: target.handle.affectedRange,
    position: target.position,
  });
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

export function duplicateMarkdownBlockHandle(
  view: EditorView,
  handle: MiraMarkdownBlockHandle,
): void {
  if (handle.role !== "list-item") {
    duplicateMarkdownBlockRange(view, handle.affectedRange);
    return;
  }

  const markdown = view.state.doc.toString();
  const source = view.state.doc.sliceString(
    handle.affectedRange.from,
    handle.affectedRange.to,
  );
  const insertion = insertMarkdownListSubtree(
    markdown,
    handle.affectedRange.to,
    source,
  );

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

export function deleteMarkdownBlockHandle(
  view: EditorView,
  handle: MiraMarkdownBlockHandle,
): void {
  deleteMarkdownBlockRange(view, handle.affectedRange);
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

function collectListItemHandles(
  state: EditorState,
  lines: MarkdownLine[],
): MiraMarkdownBlockHandle[] {
  const handles: MiraMarkdownBlockHandle[] = [];
  const stack: Array<{ id: string; indent: number }> = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (!isListItem(line)) {
      continue;
    }

    const indent = listIndent(line);
    while (stack.length > 0 && stack.at(-1)!.indent >= indent) {
      stack.pop();
    }

    const endIndex = consumeListItem(lines, index);
    const handleRange = createBlock(state, "list", lines, index, index);
    const affectedRange = createBlock(state, "list", lines, index, endIndex);
    const id = `list-item-${line.number}`;
    const parentId = stack.at(-1)?.id;
    handles.push({
      id,
      role: "list-item",
      handleRange: { ...handleRange, id },
      affectedRange: { ...affectedRange, id },
      listIndent: indent,
      parentId,
    });
    stack.push({ id, indent });
  }

  return handles;
}

function headingLevelForBlock(
  lines: MarkdownLine[],
  block: MiraMarkdownBlockRange,
): number | null {
  const start = lines[block.startLine - 1];
  if (!start) {
    return null;
  }

  const atx = atxHeadingLevel(start);
  if (atx) {
    return atx;
  }

  const underline = lines[block.endLine - 1];
  return underline ? setextHeadingLevel(underline) : null;
}

function headingSectionRange(
  state: EditorState,
  lines: MarkdownLine[],
  block: MiraMarkdownBlockRange,
  headingLevel: number,
): MiraMarkdownBlockRange {
  let endIndex = lines.length - 1;

  for (let index = block.endLine; index < lines.length; index += 1) {
    const level = headingLevelAt(lines, index);
    if (level !== null && level <= headingLevel) {
      endIndex = Math.max(
        block.endLine - 1,
        previousContentIndex(lines, index),
      );
      break;
    }
  }

  return {
    ...createBlock(state, "heading", lines, block.startLine - 1, endIndex),
    id: block.id,
  };
}

function previousContentIndex(
  lines: MarkdownLine[],
  beforeIndex: number,
): number {
  for (let index = beforeIndex - 1; index >= 0; index -= 1) {
    if (lines[index]!.trimmed) {
      return index;
    }
  }
  return Math.max(0, beforeIndex - 1);
}

function headingLevelAt(lines: MarkdownLine[], index: number): number | null {
  const line = lines[index];
  if (!line) {
    return null;
  }

  const atx = atxHeadingLevel(line);
  if (atx) {
    return atx;
  }

  if (index > 0 && lines[index - 1]?.trimmed) {
    return setextHeadingLevel(line);
  }

  return null;
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

function moveMarkdownListItemHandle(
  view: EditorView,
  source: MiraMarkdownBlockHandle,
  target: MiraMarkdownBlockHandleMoveTarget,
): boolean {
  const resolvedTarget = target.handle;
  if (source.id === resolvedTarget.id) {
    return false;
  }

  if (target.position === "inside" && resolvedTarget.role !== "list-item") {
    return false;
  }

  const doc = view.state.doc;
  const sourceEdit = editableBlockRange(doc, source.affectedRange);
  const insertOffset = insertionOffsetForHandleTarget(
    resolvedTarget,
    target.position,
  );

  if (insertOffset > sourceEdit.from && insertOffset < sourceEdit.to) {
    return false;
  }

  const markdown = doc.toString();
  const sourceText = markdown.slice(
    source.affectedRange.from,
    source.affectedRange.to,
  );
  const targetIndent = targetListIndent(
    view.state,
    source,
    resolvedTarget,
    target.position,
  );
  const movedText = reindentListSubtree(
    sourceText,
    source.listIndent ?? 0,
    targetIndent,
  );
  const withoutSource =
    markdown.slice(0, sourceEdit.from) + markdown.slice(sourceEdit.to);
  const adjustedInsertOffset =
    insertOffset > sourceEdit.from
      ? insertOffset - (sourceEdit.to - sourceEdit.from)
      : insertOffset;
  const insertion =
    resolvedTarget.role === "list-item"
      ? insertMarkdownListSubtree(
          withoutSource,
          adjustedInsertOffset,
          movedText,
        )
      : insertMarkdownBlock(withoutSource, adjustedInsertOffset, movedText);

  view.dispatch({
    changes: { from: 0, to: doc.length, insert: insertion.markdown },
    selection: { anchor: insertion.to },
    scrollIntoView: true,
    userEvent: "move.block",
  });
  return true;
}

function insertionOffsetForHandleTarget(
  target: MiraMarkdownBlockHandle,
  position: MiraMarkdownBlockHandleMoveTarget["position"],
): number {
  if (position === "before") {
    return target.affectedRange.from;
  }
  return target.affectedRange.to;
}

function targetListIndent(
  state: EditorState,
  source: MiraMarkdownBlockHandle,
  target: MiraMarkdownBlockHandle,
  position: MiraMarkdownBlockHandleMoveTarget["position"],
): number {
  if (target.role !== "list-item") {
    return 0;
  }

  if (position !== "inside") {
    return target.listIndent ?? 0;
  }

  return (target.listIndent ?? 0) + inferListIndentUnit(state, source, target);
}

function inferListIndentUnit(
  state: EditorState,
  source: MiraMarkdownBlockHandle,
  target: MiraMarkdownBlockHandle,
): number {
  const handles = collectMarkdownBlockHandles(state);
  const child = handles.find(
    (handle) =>
      handle.role === "list-item" &&
      handle.parentId === target.id &&
      handle.id !== source.id,
  );
  if (child?.listIndent !== undefined && target.listIndent !== undefined) {
    return Math.max(1, child.listIndent - target.listIndent);
  }

  const sibling = handles.find(
    (handle) =>
      handle.role === "list-item" &&
      handle.parentId === target.parentId &&
      handle.id !== source.id &&
      handle.listIndent !== target.listIndent,
  );
  if (sibling?.listIndent !== undefined && target.listIndent !== undefined) {
    return Math.max(1, Math.abs(sibling.listIndent - target.listIndent));
  }

  return 2;
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

function insertMarkdownListSubtree(
  markdown: string,
  offset: number,
  blockMarkdown: string,
): { markdown: string; from: number; to: number } {
  const before = markdown.slice(0, offset);
  const after = markdown.slice(offset);
  const prefix = before && !before.endsWith("\n") ? "\n" : "";
  const suffix = after && !after.startsWith("\n") ? "\n" : "";
  const insert = `${prefix}${blockMarkdown.trimEnd()}${suffix}`;
  const from = offset + prefix.length;

  return {
    markdown: `${before}${insert}${after}`,
    from,
    to: from + blockMarkdown.trimEnd().length,
  };
}

function reindentListSubtree(
  markdown: string,
  sourceIndent: number,
  targetIndent: number,
): string {
  const delta = targetIndent - sourceIndent;
  if (delta === 0) {
    return markdown;
  }

  return markdown
    .split("\n")
    .map((line) => reindentLine(line, delta))
    .join("\n");
}

function reindentLine(line: string, delta: number): string {
  if (!line.trim()) {
    return line;
  }

  if (delta > 0) {
    return `${" ".repeat(delta)}${line}`;
  }

  const removeCount = Math.min(line.match(/^\s*/u)?.[0].length ?? 0, -delta);
  return line.slice(removeCount);
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

function consumeListItem(lines: MarkdownLine[], startIndex: number): number {
  const baseIndent = listIndent(lines[startIndex]!);
  let endIndex = startIndex;

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (!line.trimmed) {
      const next = lines[index + 1];
      if (
        next &&
        (listIndent(next) > baseIndent ||
          (isListItem(next) && listIndent(next) > baseIndent))
      ) {
        endIndex = index;
        continue;
      }
      break;
    }

    if (isListItem(line) && listIndent(line) <= baseIndent) {
      break;
    }

    if (listIndent(line) > baseIndent) {
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

function atxHeadingLevel(line: MarkdownLine): number | null {
  const match = line.text.match(/^ {0,3}(#{1,6})(?:\s|$)/u);
  return match?.[1]?.length ?? null;
}

function isSetextHeadingUnderline(line: MarkdownLine): boolean {
  return /^ {0,3}(?:=+|-+)\s*$/u.test(line.text);
}

function setextHeadingLevel(line: MarkdownLine): number | null {
  const match = line.text.match(/^ {0,3}(=+|-+)\s*$/u);
  if (!match?.[1]) {
    return null;
  }
  return match[1][0] === "=" ? 1 : 2;
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
