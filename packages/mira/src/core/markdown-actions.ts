import { syntaxTree } from "@codemirror/language";
import {
  EditorSelection,
  EditorState,
  Transaction,
  type ChangeSpec,
} from "@codemirror/state";
import type { SyntaxNode } from "@lezer/common";
import type { EditorView } from "@codemirror/view";

export const miraMarkdownActionIds = [
  "heading",
  "bold",
  "italic",
  "strikethrough",
  "inlineCode",
  "quote",
  "bulletList",
  "numberedList",
  "taskList",
  "link",
] as const;

export type MiraMarkdownActionId = (typeof miraMarkdownActionIds)[number];

type InlineActionId = Extract<
  MiraMarkdownActionId,
  "bold" | "italic" | "strikethrough" | "inlineCode" | "link"
>;

type LineActionId = Exclude<MiraMarkdownActionId, InlineActionId>;

type MarkdownEdit = {
  changes: ChangeSpec | readonly ChangeSpec[];
  selection?: EditorSelection;
};

type InlineRange = {
  from: number;
  to: number;
  contentFrom: number;
  contentTo: number;
  content: string;
};

type ListKind = "bulletList" | "numberedList" | "taskList";

type ListMarker = {
  kind: ListKind;
  from: number;
  to: number;
};

export function applyMiraMarkdownAction(
  view: EditorView,
  action: MiraMarkdownActionId,
): boolean {
  if (view.state.facet(EditorState.readOnly)) {
    return false;
  }

  const edit = isInlineAction(action)
    ? createInlineEdit(view.state, action)
    : createLineEdit(view.state, action);
  if (!edit) {
    return false;
  }

  const scrollTop = view.scrollDOM.scrollTop;
  const scrollLeft = view.scrollDOM.scrollLeft;
  view.dispatch({
    changes: edit.changes,
    selection: edit.selection,
    annotations: Transaction.userEvent.of("input.format"),
  });
  view.focus();
  view.scrollDOM.scrollTop = scrollTop;
  view.scrollDOM.scrollLeft = scrollLeft;
  return true;
}

function isInlineAction(
  action: MiraMarkdownActionId,
): action is InlineActionId {
  return (
    action === "bold" ||
    action === "italic" ||
    action === "strikethrough" ||
    action === "inlineCode" ||
    action === "link"
  );
}

function createInlineEdit(
  state: EditorState,
  action: InlineActionId,
): MarkdownEdit | null {
  const range = state.selection.main;
  const existing = findExistingInlineRange(state, action, range.from, range.to);
  const exactExisting =
    existing &&
    (range.empty ||
      action === "link" ||
      (range.from === existing.from && range.to === existing.to) ||
      (range.from === existing.contentFrom && range.to === existing.contentTo));

  if (existing && exactExisting) {
    return removeInlineRange(state, existing);
  }

  if (!range.empty) {
    return wrapInlineRange(state, action, range.from, range.to);
  }

  const word = wordAtCaret(state, range.head);
  if (word) {
    return wrapInlineRange(state, action, word.from, word.to, range.head);
  }

  return insertEmptyInlineTemplate(state, action, range.head);
}

function findExistingInlineRange(
  state: EditorState,
  action: InlineActionId,
  from: number,
  to: number,
): InlineRange | null {
  const syntaxRange = findSyntaxInlineRange(state, action, from, to);
  if (syntaxRange) {
    return syntaxRange;
  }

  if (action === "link") {
    return findDelimitedLink(state.doc.toString(), from, to);
  }

  const delimiters =
    action === "bold"
      ? ["**", "__"]
      : action === "italic"
        ? ["_", "*"]
        : action === "strikethrough"
          ? ["~~"]
          : ["`"];
  return findDelimitedRange(state.doc.toString(), from, to, delimiters);
}

function findSyntaxInlineRange(
  state: EditorState,
  action: InlineActionId,
  from: number,
  to: number,
): InlineRange | null {
  const nodeNames =
    action === "bold"
      ? new Set(["StrongEmphasis"])
      : action === "italic"
        ? new Set(["Emphasis"])
        : action === "inlineCode"
          ? new Set(["InlineCode"])
          : action === "link"
            ? new Set(["Link"])
            : new Set<string>();
  if (nodeNames.size === 0) {
    return null;
  }

  const node = smallestContainingNode(state, nodeNames, from, to);
  if (!node) {
    return null;
  }

  return inlineRangeFromNode(state, action, node);
}

function smallestContainingNode(
  state: EditorState,
  names: ReadonlySet<string>,
  from: number,
  to: number,
): SyntaxNode | null {
  const tree = syntaxTree(state);
  const positions = new Set([
    Math.max(0, Math.min(state.doc.length, from)),
    Math.max(0, Math.min(state.doc.length, to)),
    Math.max(0, Math.min(state.doc.length, from - 1)),
  ]);
  let best: SyntaxNode | null = null;

  for (const position of positions) {
    for (const bias of [-1, 1] as const) {
      let node: SyntaxNode | null = tree.resolveInner(position, bias);
      while (node) {
        if (
          names.has(node.name) &&
          node.from <= from &&
          node.to >= to &&
          (!best || node.to - node.from < best.to - best.from)
        ) {
          best = node;
        }
        node = node.parent;
      }
    }
  }

  return best;
}

function inlineRangeFromNode(
  state: EditorState,
  action: InlineActionId,
  node: SyntaxNode,
): InlineRange | null {
  const source = state.sliceDoc(node.from, node.to);
  if (action === "link") {
    const open = source.indexOf("[");
    const close = source.indexOf("](", open + 1);
    if (open !== 0 || close === -1 || !source.endsWith(")")) {
      return null;
    }
    return {
      from: node.from,
      to: node.to,
      contentFrom: node.from + 1,
      contentTo: node.from + close,
      content: source.slice(1, close),
    };
  }

  const delimiter = delimiterFromSource(action, source);
  if (!delimiter) {
    return null;
  }
  return {
    from: node.from,
    to: node.to,
    contentFrom: node.from + delimiter.length,
    contentTo: node.to - delimiter.length,
    content: source.slice(delimiter.length, -delimiter.length),
  };
}

function delimiterFromSource(
  action: Exclude<InlineActionId, "link">,
  source: string,
): string | null {
  if (action === "bold") {
    return source.startsWith("**") && source.endsWith("**")
      ? "**"
      : source.startsWith("__") && source.endsWith("__")
        ? "__"
        : null;
  }
  if (action === "italic") {
    return source.startsWith("_") && source.endsWith("_")
      ? "_"
      : source.startsWith("*") && source.endsWith("*")
        ? "*"
        : null;
  }
  if (action === "strikethrough") {
    return source.startsWith("~~") && source.endsWith("~~") ? "~~" : null;
  }
  const opening = source.match(/^`+/u)?.[0];
  return opening && source.endsWith(opening) ? opening : null;
}

function findDelimitedRange(
  markdown: string,
  from: number,
  to: number,
  delimiters: readonly string[],
): InlineRange | null {
  const lineStart = markdown.lastIndexOf("\n", Math.max(0, from - 1)) + 1;
  const nextNewline = markdown.indexOf("\n", to);
  const lineEnd = nextNewline === -1 ? markdown.length : nextNewline;
  let best: InlineRange | null = null;

  for (const delimiter of delimiters) {
    let opening = markdown.lastIndexOf(delimiter, from);
    while (opening >= lineStart) {
      const contentFrom = opening + delimiter.length;
      const closing = markdown.indexOf(delimiter, Math.max(contentFrom, to));
      if (
        closing !== -1 &&
        closing <= lineEnd &&
        contentFrom <= from &&
        closing >= to
      ) {
        const candidate = {
          from: opening,
          to: closing + delimiter.length,
          contentFrom,
          contentTo: closing,
          content: markdown.slice(contentFrom, closing),
        };
        if (!best || candidate.to - candidate.from < best.to - best.from) {
          best = candidate;
        }
        break;
      }
      opening = markdown.lastIndexOf(delimiter, opening - 1);
    }
  }

  return best;
}

function findDelimitedLink(
  markdown: string,
  from: number,
  to: number,
): InlineRange | null {
  const lineStart = markdown.lastIndexOf("\n", Math.max(0, from - 1)) + 1;
  const lineEndIndex = markdown.indexOf("\n", to);
  const lineEnd = lineEndIndex === -1 ? markdown.length : lineEndIndex;
  let opening = markdown.lastIndexOf("[", from);

  while (opening >= lineStart) {
    const labelEnd = markdown.indexOf("](", opening + 1);
    const close = labelEnd === -1 ? -1 : markdown.indexOf(")", labelEnd + 2);
    if (
      labelEnd !== -1 &&
      close !== -1 &&
      close < lineEnd &&
      opening <= from &&
      close + 1 >= to
    ) {
      return {
        from: opening,
        to: close + 1,
        contentFrom: opening + 1,
        contentTo: labelEnd,
        content: markdown.slice(opening + 1, labelEnd),
      };
    }
    opening = markdown.lastIndexOf("[", opening - 1);
  }
  return null;
}

function removeInlineRange(
  state: EditorState,
  existing: InlineRange,
): MarkdownEdit {
  const selection = state.selection.main;
  const mapPosition = (position: number): number => {
    if (position <= existing.contentFrom) {
      return existing.from;
    }
    if (position >= existing.contentTo) {
      return existing.from + existing.content.length;
    }
    return existing.from + position - existing.contentFrom;
  };

  let anchor = mapPosition(selection.anchor);
  let head = mapPosition(selection.head);
  if (!selection.empty) {
    const forward = selection.anchor <= selection.head;
    anchor = forward ? existing.from : existing.from + existing.content.length;
    head = forward ? existing.from + existing.content.length : existing.from;
  }

  return {
    changes: {
      from: existing.from,
      to: existing.to,
      insert: existing.content,
    },
    selection: EditorSelection.single(anchor, head),
  };
}

function wordAtCaret(
  state: EditorState,
  caret: number,
): { from: number; to: number } | null {
  if (
    caret < state.doc.length &&
    /\s/u.test(state.sliceDoc(caret, caret + 1))
  ) {
    return null;
  }
  const direct = state.wordAt(caret);
  if (direct && direct.from <= caret && direct.to >= caret) {
    return direct;
  }
  if (caret > 0) {
    const previous = state.wordAt(caret - 1);
    if (previous && previous.to === caret) {
      return previous;
    }
  }
  return null;
}

function wrapInlineRange(
  state: EditorState,
  action: InlineActionId,
  from: number,
  to: number,
  preservedCaret?: number,
): MarkdownEdit {
  const selected = state.sliceDoc(from, to);
  if (action === "link") {
    const label = selected || "label";
    const target = "https://example.com";
    const insert = `[${label}](${target})`;
    const targetFrom = from + label.length + 3;
    return {
      changes: { from, to, insert },
      selection: EditorSelection.single(targetFrom, targetFrom + target.length),
    };
  }

  const delimiter = canonicalDelimiter(action, selected);
  const insert = `${delimiter}${selected}${delimiter}`;
  const selection = state.selection.main;
  if (preservedCaret !== undefined) {
    const caret = from + delimiter.length + preservedCaret - from;
    return {
      changes: { from, to, insert },
      selection: EditorSelection.single(caret),
    };
  }

  const forward = selection.anchor <= selection.head;
  const innerFrom = from + delimiter.length;
  const innerTo = innerFrom + selected.length;
  return {
    changes: { from, to, insert },
    selection: EditorSelection.single(
      forward ? innerFrom : innerTo,
      forward ? innerTo : innerFrom,
    ),
  };
}

function canonicalDelimiter(
  action: Exclude<InlineActionId, "link">,
  selected: string,
): string {
  if (action === "bold") return "**";
  if (action === "italic") return "_";
  if (action === "strikethrough") return "~~";

  let longestRun = 0;
  for (const match of selected.matchAll(/`+/gu)) {
    longestRun = Math.max(longestRun, match[0].length);
  }
  return "`".repeat(longestRun + 1);
}

function insertEmptyInlineTemplate(
  state: EditorState,
  action: InlineActionId,
  at: number,
): MarkdownEdit {
  if (action === "link") {
    const label = "label";
    const target = "https://example.com";
    const insert = `[${label}](${target})`;
    const targetFrom = at + label.length + 3;
    return {
      changes: { from: at, insert },
      selection: EditorSelection.single(targetFrom, targetFrom + target.length),
    };
  }

  const delimiter = canonicalDelimiter(action, "");
  return {
    changes: { from: at, insert: `${delimiter}${delimiter}` },
    selection: EditorSelection.single(at + delimiter.length),
  };
}

function createLineEdit(
  state: EditorState,
  action: LineActionId,
): MarkdownEdit | null {
  if (action === "heading") {
    return createHeadingEdit(state);
  }
  if (action === "quote") {
    return createQuoteEdit(state);
  }
  return createListEdit(state, action);
}

function selectedLines(state: EditorState) {
  const selection = state.selection.main;
  const start = state.doc.lineAt(selection.from);
  let endOffset = selection.to;
  if (
    !selection.empty &&
    endOffset > 0 &&
    state.doc.lineAt(endOffset).from === endOffset
  ) {
    endOffset -= 1;
  }
  const end = state.doc.lineAt(endOffset);
  return Array.from({ length: end.number - start.number + 1 }, (_, index) =>
    state.doc.line(start.number + index),
  );
}

function mappedLineSelection(
  state: EditorState,
  changes: readonly ChangeSpec[],
): EditorSelection {
  const changeSet = state.changes(changes);
  const selection = state.selection.main;
  return EditorSelection.single(
    changeSet.mapPos(selection.anchor, 1),
    changeSet.mapPos(selection.head, 1),
  );
}

function createHeadingEdit(state: EditorState): MarkdownEdit | null {
  const lines = selectedLines(state);
  const collapsed = state.selection.main.empty;
  const setextTitles = findSetextTitles(state, lines);
  const eligible = lines.filter((line) => {
    if (setextTitles.underlines.has(line.number)) return false;
    const contentAt = headingContentPosition(line.text);
    return collapsed || line.text.slice(contentAt).trim().length > 0;
  });
  if (eligible.length === 0) return null;

  const allHeadings = eligible.every((line) => {
    const contentAt = headingContentPosition(line.text);
    return Boolean(
      atxHeadingAt(line.text, contentAt) ||
      setextTitles.titles.has(line.number),
    );
  });
  const changes: ChangeSpec[] = [];

  for (const line of eligible) {
    const contentAt = headingContentPosition(line.text);
    const atx = atxHeadingAt(line.text, contentAt);
    const setext = setextTitles.titles.get(line.number);

    if (allHeadings) {
      if (atx) {
        changes.push({ from: line.from + atx.from, to: line.from + atx.to });
        const closing = closingAtxMarker(line.text, atx.to);
        if (closing) {
          changes.push({
            from: line.from + closing.from,
            to: line.from + closing.to,
          });
        }
      }
      if (setext) {
        changes.push({ from: line.to, to: setext.underlineTo });
      }
      continue;
    }

    if (atx) {
      changes.push({
        from: line.from + atx.from,
        to: line.from + atx.to,
        insert: "# ",
      });
      const closing = closingAtxMarker(line.text, atx.to);
      if (closing) {
        changes.push({
          from: line.from + closing.from,
          to: line.from + closing.to,
        });
      }
    } else {
      changes.push({ from: line.from + contentAt, insert: "# " });
    }
    if (setext) {
      changes.push({ from: line.to, to: setext.underlineTo });
    }
  }

  return {
    changes,
    selection: mappedLineSelection(state, changes),
  };
}

function findSetextTitles(
  state: EditorState,
  lines: ReturnType<typeof selectedLines>,
): {
  titles: Map<number, { underlineTo: number }>;
  underlines: Set<number>;
} {
  const titles = new Map<number, { underlineTo: number }>();
  const underlines = new Set<number>();
  const selectedNumbers = new Set(lines.map((line) => line.number));

  for (const line of lines) {
    if (line.number >= state.doc.lines) continue;
    const next = state.doc.line(line.number + 1);
    if (
      !/^\s*(?:=+|-+)\s*$/u.test(next.text) ||
      line.text.trim().length === 0
    ) {
      continue;
    }
    titles.set(line.number, { underlineTo: next.to });
    if (selectedNumbers.has(next.number)) underlines.add(next.number);
  }
  return { titles, underlines };
}

function atxHeadingAt(
  text: string,
  at: number,
): { from: number; to: number } | null {
  const match = text.slice(at).match(/^(#{1,6})(?:[\t ]+|$)/u);
  return match ? { from: at, to: at + match[0].length } : null;
}

function closingAtxMarker(
  text: string,
  after: number,
): { from: number; to: number } | null {
  const suffix = text.slice(after).match(/[\t ]+#+[\t ]*$/u);
  return suffix?.index === undefined
    ? null
    : { from: after + suffix.index, to: text.length };
}

function createQuoteEdit(state: EditorState): MarkdownEdit {
  const lines = selectedLines(state);
  const targets = lines.map((line) => {
    const at = quotePosition(line.text);
    return { line, at, marker: quoteMarkerAt(line.text, at) };
  });
  const allQuoted = targets.every(({ marker }) => marker !== null);
  const changes: ChangeSpec[] = [];

  for (const { line, at, marker } of targets) {
    if (allQuoted && marker) {
      changes.push({
        from: line.from + marker.from,
        to: line.from + marker.to,
      });
    } else if (!allQuoted && !marker) {
      const remainder = line.text.slice(at);
      changes.push({
        from: line.from + at,
        insert: remainder.trim().length === 0 ? ">" : "> ",
      });
    }
  }

  return {
    changes,
    selection: mappedLineSelection(state, changes),
  };
}

function createListEdit(
  state: EditorState,
  target: ListKind,
): MarkdownEdit | null {
  const lines = selectedLines(state);
  const collapsed = state.selection.main.empty;
  const targets = lines
    .map((line) => {
      const at = listPosition(line.text);
      const marker = listMarkerAt(line.text, at);
      const meaningful =
        marker || line.text.slice(at).trim().length > 0 || collapsed;
      return meaningful ? { line, at, marker } : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  if (targets.length === 0) return null;

  const allTarget = targets.every(({ marker }) => marker?.kind === target);
  const changes: ChangeSpec[] = [];
  const replacement =
    target === "bulletList"
      ? "- "
      : target === "numberedList"
        ? "1. "
        : "- [ ] ";

  for (const { line, at, marker } of targets) {
    if (allTarget && marker) {
      changes.push({
        from: line.from + marker.from,
        to: line.from + marker.to,
      });
    } else if (!allTarget && marker?.kind !== target) {
      changes.push({
        from: line.from + (marker?.from ?? at),
        to: line.from + (marker?.to ?? at),
        insert: replacement,
      });
    }
  }

  return {
    changes,
    selection: mappedLineSelection(state, changes),
  };
}

function leadingWhitespaceEnd(text: string): number {
  return text.match(/^[\t ]*/u)?.[0].length ?? 0;
}

function quoteMarkerAt(
  text: string,
  at: number,
): { from: number; to: number } | null {
  if (text[at] !== ">") return null;
  const trailingSpace = text[at + 1] === " " || text[at + 1] === "\t" ? 1 : 0;
  return { from: at, to: at + 1 + trailingSpace };
}

function listMarkerAt(text: string, at: number): ListMarker | null {
  const source = text.slice(at);
  const task = source.match(/^[-+*][\t ]+\[[^\]\r\n]?\](?:[\t ]+|$)/u);
  if (task) return { kind: "taskList", from: at, to: at + task[0].length };

  const bullet = source.match(/^[-+*](?:[\t ]+|$)/u);
  if (bullet)
    return { kind: "bulletList", from: at, to: at + bullet[0].length };

  const numbered = source.match(/^\d+[.)](?:[\t ]+|$)/u);
  return numbered
    ? { kind: "numberedList", from: at, to: at + numbered[0].length }
    : null;
}

function consumeQuotes(text: string, start: number): number {
  let at = start;
  while (true) {
    const marker = quoteMarkerAt(text, at);
    if (!marker) return at;
    at = marker.to;
  }
}

function listPosition(text: string): number {
  return consumeQuotes(text, leadingWhitespaceEnd(text));
}

function quotePosition(text: string): number {
  const indent = leadingWhitespaceEnd(text);
  const list = listMarkerAt(text, indent);
  return list?.to ?? indent;
}

function headingContentPosition(text: string): number {
  let at = leadingWhitespaceEnd(text);
  while (true) {
    const nextQuote = quoteMarkerAt(text, at);
    if (nextQuote) {
      at = nextQuote.to;
      continue;
    }
    const nextList = listMarkerAt(text, at);
    if (nextList) {
      at = nextList.to;
      continue;
    }
    return at;
  }
}
