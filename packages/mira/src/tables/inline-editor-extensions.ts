import { syntaxHighlighting } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { EditorView, drawSelection } from "@codemirror/view";
import { history } from "@codemirror/commands";
import { miraClassHighlighter } from "@lapismd/mira/codemirror";
import { createMarkdownCodeMirrorExtensions } from "@lapismd/mira/codemirror";

export function createInlineTableMarkdownExtensions(): Extension[] {
  return [
    drawSelection(),
    EditorView.lineWrapping,
    history(),
    EditorView.editable.of(true),
    EditorView.editorAttributes.of({ class: "mod-inline" }),
    syntaxHighlighting(miraClassHighlighter),
    createMarkdownCodeMirrorExtensions(),
  ];
}
