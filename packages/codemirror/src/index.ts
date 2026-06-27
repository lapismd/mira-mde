import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentLess,
  indentMore,
} from "@codemirror/commands";
import {
  bracketMatching,
  codeFolding,
  foldGutter,
  foldKeymap,
  indentOnInput,
  indentUnit,
  syntaxHighlighting,
} from "@codemirror/language";
import { lintKeymap } from "@codemirror/lint";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { EditorState, type Extension } from "@codemirror/state";
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  placeholder,
  rectangularSelection,
} from "@codemirror/view";
import { tagHighlighter, tags } from "@lezer/highlight";

export type MiraCodeMirrorOptions = {
  readonly?: boolean;
  placeholder?: string;
  lineWrapping?: boolean;
  spellcheck?: boolean;
  indentWithTabs?: boolean;
  indentWidth?: number;
  lineNumbers?: boolean;
  autocomplete?:
    Exclude<Parameters<typeof autocompletion>[0], undefined> | false;
};

export const miraClassHighlighter = tagHighlighter([
  { tag: tags.link, class: "cm-link" },
  { tag: tags.heading, class: "cm-heading" },
  { tag: tags.emphasis, class: "cm-emphasis" },
  { tag: tags.strong, class: "cm-strong" },
  { tag: tags.keyword, class: "cm-keyword" },
  { tag: tags.atom, class: "cm-meta" },
  { tag: tags.bool, class: "cm-bool" },
  { tag: tags.url, class: "cm-url" },
  { tag: tags.labelName, class: "cm-label" },
  { tag: tags.inserted, class: "cm-inserted" },
  { tag: tags.deleted, class: "cm-deleted" },
  { tag: tags.literal, class: "cm-literal" },
  { tag: tags.string, class: "cm-string" },
  { tag: tags.attributeValue, class: "cm-string" },
  { tag: tags.number, class: "cm-number" },
  {
    tag: [tags.regexp, tags.escape, tags.special(tags.string)],
    class: "cm-string-2",
  },
  { tag: tags.variableName, class: "cm-variable" },
  { tag: tags.local(tags.variableName), class: "cm-local" },
  { tag: tags.definition(tags.variableName), class: "cm-definition" },
  { tag: tags.special(tags.variableName), class: "cm-variable-2" },
  { tag: tags.definition(tags.propertyName), class: "cm-definition" },
  { tag: tags.typeName, class: "cm-type" },
  { tag: tags.namespace, class: "cm-namespace" },
  { tag: tags.className, class: "cm-class" },
  { tag: tags.macroName, class: "cm-macro" },
  { tag: tags.propertyName, class: "cm-property" },
  { tag: tags.attributeName, class: "cm-attribute" },
  { tag: tags.operator, class: "cm-operator" },
  { tag: [tags.comment, tags.contentSeparator], class: "cm-comment" },
  { tag: tags.meta, class: "cm-meta" },
  { tag: tags.processingInstruction, class: "cm-meta" },
  { tag: tags.invalid, class: "cm-invalid" },
  { tag: tags.punctuation, class: "cm-punctuation" },
  { tag: tags.bracket, class: "cm-bracket" },
  { tag: tags.strikethrough, class: "cm-line-through" },
]);

export const miraEditorTheme = EditorView.theme({
  "&": {
    height: "100%",
    color: "var(--mira-foreground)",
    backgroundColor: "var(--mira-editor-background)",
    fontSize: "var(--mira-font-size)",
  },
  ".cm-scroller": {
    fontFamily: "var(--mira-font-mono)",
    lineHeight: "var(--mira-line-height)",
  },
  ".cm-content": {
    minHeight: "100%",
    padding: "var(--mira-editor-padding)",
  },
  ".cm-gutters": {
    backgroundColor: "var(--mira-editor-background)",
    color: "var(--mira-muted-foreground)",
    borderRight: "1px solid var(--mira-border)",
  },
  ".cm-activeLine, .cm-activeLineGutter": {
    backgroundColor: "var(--mira-accent-soft)",
  },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: "var(--mira-selection)",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-placeholder": {
    color: "var(--mira-muted-foreground)",
  },
  ".cm-tooltip": {
    border: "1px solid var(--mira-border)",
    backgroundColor: "var(--mira-popover)",
    color: "var(--mira-popover-foreground)",
  },
});

export function createBaseCodeMirrorExtensions(
  options: MiraCodeMirrorOptions = {},
): Extension[] {
  const indentWidth = normalizeIndentWidth(options.indentWidth);
  const readonly = options.readonly ?? false;
  const autocompleteConfig = options.autocomplete;

  return [
    miraEditorTheme,
    ...((options.lineNumbers ?? true) ? [lineNumbers()] : []),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    EditorState.readOnly.of(readonly),
    EditorView.editable.of(!readonly),
    EditorView.contentAttributes.of({
      spellcheck: String(options.spellcheck ?? true),
    }),
    indentOnInput(),
    syntaxHighlighting(miraClassHighlighter),
    bracketMatching(),
    closeBrackets(),
    ...(autocompleteConfig === false
      ? []
      : [
          autocompletion({
            icons: false,
            ...(autocompleteConfig ?? {}),
          }),
        ]),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    codeFolding(),
    indentUnit.of(
      options.indentWithTabs === false ? " ".repeat(indentWidth) : "\t",
    ),
    EditorState.tabSize.of(indentWidth),
    (options.lineWrapping ?? true) ? EditorView.lineWrapping : [],
    options.placeholder ? placeholder(options.placeholder) : [],
    EditorView.editorAttributes.of({
      class: "mira-codemirror mod-cm6",
      "data-mira-readonly": readonly ? "true" : "false",
    }),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
      ...lintKeymap,
      {
        key: "Tab",
        run: indentMore,
        shift: indentLess,
      },
    ]),
  ];
}

function normalizeIndentWidth(width: number | undefined): number {
  if (typeof width !== "number" || !Number.isFinite(width)) {
    return 2;
  }

  return Math.max(1, Math.floor(width));
}
