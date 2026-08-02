import {
  StateField,
  type EditorState,
  type Extension,
  type Range,
} from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView } from "@codemirror/view";
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

export function buildCodeBlockLineDecorations(
  state: EditorState,
): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  let active:
    | {
        character: "`" | "~";
        length: number;
        language: string;
        startNumber: number;
      }
    | undefined;

  for (let number = 1; number <= state.doc.lines; number += 1) {
    const line = state.doc.line(number);
    const wasActive = Boolean(active);
    if (!active) {
      const opening = line.text.match(/^\s*(`{3,}|~{3,})\s*([^\s`]*)/u);
      if (!opening?.[1]) {
        continue;
      }
      active = {
        character: opening[1][0] as "`" | "~",
        language: (opening[2] ?? "").toLocaleLowerCase(),
        length: opening[1].length,
        startNumber: number,
      };
    }

    const closing = line.text.match(/^\s*(`{3,}|~{3,})\s*$/u)?.[1];
    const isClosing =
      wasActive &&
      Boolean(closing) &&
      closing![0] === active.character &&
      closing!.length >= active.length;

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

  return Decoration.set(sortRanges(decorations));
}

export function codeBlockLineDecorations(): Extension {
  return StateField.define<DecorationSet>({
    create: buildCodeBlockLineDecorations,
    update(value, transaction) {
      return transaction.docChanged
        ? buildCodeBlockLineDecorations(transaction.state)
        : value.map(transaction.changes);
    },
    provide: (field) => EditorView.decorations.from(field),
  });
}
