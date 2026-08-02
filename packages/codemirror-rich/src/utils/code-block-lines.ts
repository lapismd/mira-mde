import {
  StateField,
  type EditorState,
  type Extension,
  type Range,
} from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView } from "@codemirror/view";
import { sortRanges } from "./ranges";

// Lapis source-mode codeBlockClassExtension classes. Live-preview adds
// `cm-formatting-code` (+ start/end) via rich inline decorations only.
const codeLine = Decoration.line({
  class: "HyperMD-codeblock HyperMD-codeblock-bg",
});
const textCodeLine = Decoration.line({
  class:
    "HyperMD-codeblock HyperMD-codeblock-bg cm-formatting-code-language-text",
});

export function buildCodeBlockLineDecorations(
  state: EditorState,
): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  let active:
    | { character: "`" | "~"; length: number; language: string }
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
      };
    }

    decorations.push(
      (active.language === "text" ? textCodeLine : codeLine).range(line.from),
    );
    const closing = line.text.match(/^\s*(`{3,}|~{3,})\s*$/u)?.[1];
    if (
      wasActive &&
      closing &&
      closing[0] === active.character &&
      closing.length >= active.length
    ) {
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
