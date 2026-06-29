import { syntaxHighlighting } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { EditorView, drawSelection } from "@codemirror/view";
import { history } from "@codemirror/commands";
import { miraClassHighlighter } from "@mira-mde/codemirror";
import { createMarkdownCodeMirrorExtensions } from "@mira-mde/codemirror-markdown";

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
