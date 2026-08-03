import { syntaxTree } from "@codemirror/language";
import {
  type EditorState,
  type Extension,
  type Range,
} from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  type EditorView,
  type PluginValue,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";
import { sortRanges } from "./ranges";

/**
 * Fence chrome shared by source + live-preview (Lapis HyperMD classes plus
 * `cm-formatting-code` / start / end). Widgets stay live-preview-only; these
 * line classes keep background + rounded first/last lines with visible markers.
 */
function codeLineClasses(options: {
  language: string;
  isStart: boolean;
  isEnd: boolean;
}): string {
  const classes = [
    "HyperMD-codeblock",
    "HyperMD-codeblock-bg",
    "cm-formatting-code",
  ];
  if (options.language === "text") {
    classes.push("cm-formatting-code-language-text");
  }
  if (options.isStart) {
    classes.push("cm-formatting-code-start");
  }
  if (options.isEnd) {
    classes.push("cm-formatting-code-end");
  }
  return classes.join(" ");
}

function indentedCodeLineClasses(options: {
  isStart: boolean;
  isEnd: boolean;
}): string {
  return [
    "HyperMD-codeblock",
    "HyperMD-codeblock-bg",
    "cm-indented-codeblock",
    options.isStart ? "cm-indented-codeblock-start" : "",
    options.isEnd ? "cm-indented-codeblock-end" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

type ActiveFence = {
  character: "`" | "~";
  length: number;
  language: string;
  startNumber: number;
};

function readOpeningFence(
  lineText: string,
): Omit<ActiveFence, "startNumber"> | null {
  const opening = lineText.match(/^\s*(`{3,}|~{3,})\s*([^\s`]*)/u);
  if (!opening?.[1]) {
    return null;
  }
  return {
    character: opening[1][0] as "`" | "~",
    language: (opening[2] ?? "").toLocaleLowerCase(),
    length: opening[1].length,
  };
}

function isClosingFence(lineText: string, active: ActiveFence): boolean {
  const closing = lineText.match(/^\s*(`{3,}|~{3,})\s*$/u)?.[1];
  return Boolean(
    closing &&
    closing[0] === active.character &&
    closing.length >= active.length,
  );
}

/** True for opening, body, and closing lines of a fenced code block. */
export function isFencedCodeLine(
  state: EditorState,
  lineNumber: number,
): boolean {
  let active: ActiveFence | undefined;
  for (let number = 1; number <= lineNumber; number += 1) {
    const line = state.doc.line(number);
    const wasActive = Boolean(active);
    if (!active) {
      const opening = readOpeningFence(line.text);
      if (!opening) {
        continue;
      }
      active = { ...opening, startNumber: number };
    }

    if (number === lineNumber) {
      return true;
    }

    if (wasActive && isClosingFence(line.text, active)) {
      active = undefined;
    }
  }
  return false;
}

export function buildCodeBlockLineDecorations(
  state: EditorState,
  tree: ReturnType<typeof syntaxTree> = syntaxTree(state),
): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  let active: ActiveFence | undefined;

  for (let number = 1; number <= state.doc.lines; number += 1) {
    const line = state.doc.line(number);
    const wasActive = Boolean(active);
    if (!active) {
      const opening = readOpeningFence(line.text);
      if (!opening) {
        continue;
      }
      active = { ...opening, startNumber: number };
    }

    const isClosing = wasActive && isClosingFence(line.text, active);

    decorations.push(
      Decoration.line({
        class: codeLineClasses({
          language: active.language,
          isStart: number === active.startNumber,
          isEnd: isClosing,
        }),
      }).range(line.from),
    );

    if (isClosing) {
      active = undefined;
    }
  }

  const decoratedIndentedLines = new Set<number>();
  tree.iterate({
    from: 0,
    to: state.doc.length,
    enter(node) {
      if (node.name !== "CodeBlock" || node.from >= node.to) {
        return;
      }

      const start = state.doc.lineAt(node.from);
      const end = state.doc.lineAt(Math.max(node.from, node.to - 1));
      for (
        let lineNumber = start.number;
        lineNumber <= end.number;
        lineNumber += 1
      ) {
        if (decoratedIndentedLines.has(lineNumber)) {
          continue;
        }
        decoratedIndentedLines.add(lineNumber);
        const line = state.doc.line(lineNumber);
        decorations.push(
          Decoration.line({
            class: indentedCodeLineClasses({
              isStart: lineNumber === start.number,
              isEnd: lineNumber === end.number,
            }),
          }).range(line.from),
        );
      }
    },
  });

  return Decoration.set(sortRanges(decorations));
}

export function codeBlockLineDecorations(): Extension {
  return ViewPlugin.fromClass(
    class implements PluginValue {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildCodeBlockLineDecorations(view.state);
      }

      update(update: ViewUpdate): void {
        if (
          update.docChanged ||
          update.viewportChanged ||
          syntaxTree(update.startState) !== syntaxTree(update.state)
        ) {
          this.decorations = buildCodeBlockLineDecorations(update.state);
        }
      }
    },
    { decorations: (plugin) => plugin.decorations },
  );
}
