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
  type PluginValue,
  rectangularSelection,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";
import { tagHighlighter, tags } from "@lezer/highlight";

export {
  applyMarkdownTemplate,
  createMarkdownTemplate,
  createSlashCommandCompletionSource,
  createSlashCommandExtensions,
  createSlashSnippet,
  type MiraMarkdownTemplate,
  type MiraSlashCommand,
  type MiraSlashCommandContext,
  type MiraSlashCommandOptions,
  type MiraSlashCommandTriggerScope,
  type MiraSlashCommandUi,
  type MiraSlashSnippetOptions,
  type MiraTemplateSelection,
  type MiraTextRange,
} from "./slash-commands";
export {
  createMiraSearchExtension,
  search,
  type MiraSearchConfig,
} from "./search";
export {
  createSelectionToolbarExtension,
  defaultMiraSelectionToolbarActions,
  miraSelectionToolbarActionIds,
  type MiraSelectionToolbarActionId,
  type MiraSelectionToolbarConfig,
  type MiraSelectionToolbarPlacement,
} from "./selection-toolbar";
import { createMiraSearchExtension, type MiraSearchConfig } from "./search";

export type MiraCodeMirrorOptions = {
  readonly?: boolean;
  placeholder?: string;
  lineWrapping?: boolean;
  spellcheck?: boolean;
  indentWithTabs?: boolean;
  indentWidth?: number;
  lineNumbers?: boolean;
  autocomplete?:
    | Exclude<Parameters<typeof autocompletion>[0], undefined>
    | false;
  search?: Partial<MiraSearchConfig>;
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
    fontFamily: "var(--font-sans, var(--mira-font-sans))",
    lineHeight: "var(--mira-line-height)",
  },
  // Only the top-level scroller — nested `.mod-inline` editors (table cells,
  // etc.) must not inherit file-margin padding or they become oversized.
  "& > .cm-scroller": {
    // Full-pane scroller (scrollbar on the edge) with a centered readable
    // column — Lapis/Obsidian file-margins + file-line-width behavior.
    paddingBlock: "var(--file-margins-y, var(--mira-editor-padding, 2rem))",
    paddingInline:
      "max(var(--file-margins-x, var(--mira-editor-padding, 2rem)), calc((100% - var(--file-line-width, 700px)) / 2))",
    scrollbarGutter: "stable",
  },
  ".cm-line, .cm-gutterElement": {
    "--cm-base-block-content-height": "var(--mira-line-height)",
    "--cm-block-line-height": "var(--mira-line-height)",
    "--cm-block-padding-top": "0",
  },
  ".cm-line": {
    lineHeight: "var(--cm-block-line-height)",
    padding: "var(--cm-block-padding-top) 0 0",
  },
  // Keep min-height on the host content only so nested inline editors stay
  // compact (table cells, chrome columns).
  "& > .cm-scroller > .cm-content": {
    minHeight: "100%",
    padding: "0",
    width: "100%",
  },
  ".cm-gutters": {
    backgroundColor: "var(--mira-editor-background)",
    borderRight: "0",
    color: "var(--mira-muted-foreground)",
    fontSize: "0.85em",
    lineHeight: "var(--cm-block-line-height)",
    marginInlineEnd: "24px",
  },
  ".cm-gutters .cm-lineNumbers .cm-gutterElement": {
    alignItems: "start",
    display: "inline-flex",
    justifyContent: "end",
    minWidth: "20px",
    whiteSpace: "nowrap",
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
  ".cm-heading": {
    color: "var(--mira-syntax-heading)",
    fontWeight: "650",
  },
  ".cm-link, .cm-url, .cm-internal-link, .cm-wikilink, .cm-embed-link": {
    color: "var(--mira-syntax-link)",
    cursor: "pointer",
    textDecoration: "underline",
    textDecorationThickness: "1px",
    textUnderlineOffset: "3px",
  },
  ".cm-emphasis": {
    fontStyle: "italic",
  },
  ".cm-strong": {
    fontWeight: "700",
  },
  ".cm-line-through": {
    textDecoration: "line-through",
  },
  ".cm-comment, .cm-meta, .cm-hmd-frontmatter": {
    color: "var(--mira-syntax-comment)",
  },
  ".cm-keyword, .cm-bool, .cm-atom, .cm-literal": {
    color: "var(--mira-syntax-keyword)",
  },
  ".cm-string, .cm-string-2": {
    color: "var(--mira-syntax-string)",
  },
  ".cm-number": {
    color: "var(--mira-syntax-number)",
  },
  ".cm-variable, .cm-variable-2, .cm-local, .cm-definition, .cm-macro, .cm-namespace":
    {
      color: "var(--mira-syntax-variable)",
    },
  ".cm-property, .cm-attribute": {
    color: "var(--mira-syntax-property)",
  },
  ".cm-type, .cm-class": {
    color: "var(--mira-syntax-type)",
  },
  ".cm-operator, .cm-punctuation, .cm-bracket": {
    color: "var(--mira-syntax-operator)",
  },
  ".cm-label": {
    color: "var(--mira-code-foreground)",
    fontFamily: "var(--mira-font-mono)",
  },
  ".cm-hashtag": {
    backgroundColor: "var(--mira-tag-background)",
    borderRadius: "999px",
    color: "var(--mira-tag-foreground)",
    fontWeight: "550",
    padding: "0.05em 0.35em",
  },
  ".cm-invalid": {
    backgroundColor: "var(--mira-syntax-invalid-background)",
    color: "var(--mira-syntax-invalid)",
  },
  /* shadcn-like popover chrome for CM tooltips / autocomplete */
  ".cm-tooltip": {
    backgroundColor:
      "var(--popover, var(--mira-popover, var(--mira-widget-background)))",
    border: "1px solid var(--border, var(--mira-border))",
    borderRadius: "var(--radius-m, var(--mira-radius))",
    boxShadow: "var(--mira-widget-shadow)",
    color:
      "var(--popover-foreground, var(--mira-popover-foreground, var(--mira-foreground)))",
    fontFamily:
      "var(--font-interface, var(--mira-font-sans, ui-sans-serif, system-ui, sans-serif))",
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
    zIndex: "1100",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul": {
    fontFamily: "inherit",
    maxHeight: "min(18rem, 50vh)",
    maxWidth: "min(28rem, 95vw)",
    minWidth: "12rem",
    padding: "0.25rem",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul > li": {
    borderRadius: "var(--radius-s, 4px)",
    lineHeight: "1.4",
    padding: "0.375rem 0.5rem",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul > completion-section": {
    borderBottom: "1px solid var(--border, var(--mira-border))",
    color: "var(--muted-foreground, var(--mira-muted-foreground))",
    fontSize: "0.75rem",
    fontWeight: "600",
    letterSpacing: "0.02em",
    opacity: "1",
    padding: "0.375rem 0.5rem",
    textTransform: "uppercase",
  },
  ".cm-tooltip-autocomplete ul li[aria-selected]": {
    backgroundColor:
      "var(--accent, var(--background-modifier-hover, var(--mira-accent-soft)))",
    color: "var(--accent-foreground, var(--mira-foreground))",
  },
  ".cm-tooltip-autocomplete-disabled ul li[aria-selected]": {
    backgroundColor: "var(--muted, var(--mira-muted))",
    color: "var(--muted-foreground, var(--mira-muted-foreground))",
  },
  ".cm-completionLabel": {
    color: "inherit",
  },
  ".cm-completionDetail": {
    color: "var(--muted-foreground, var(--mira-muted-foreground))",
    fontSize: "0.75rem",
    fontStyle: "normal",
    marginLeft: "0.5rem",
  },
  ".cm-completionMatchedText": {
    color: "var(--mira-accent)",
    fontWeight: "600",
    textDecoration: "none",
  },
  ".cm-tooltip.cm-completionInfo": {
    backgroundColor:
      "var(--popover, var(--mira-popover, var(--mira-widget-background)))",
    border: "1px solid var(--border, var(--mira-border))",
    borderRadius: "var(--radius-m, var(--mira-radius))",
    boxShadow: "var(--mira-widget-shadow)",
    color:
      "var(--popover-foreground, var(--mira-popover-foreground, var(--mira-foreground)))",
    fontFamily:
      "var(--font-interface, var(--mira-font-sans, ui-sans-serif, system-ui, sans-serif))",
    fontSize: "0.8125rem",
    padding: "0.5rem 0.75rem",
  },
  ".cm-tooltip .cm-tooltip-arrow:after": {
    borderBottomColor:
      "var(--popover, var(--mira-popover, var(--mira-widget-background)))",
    borderTopColor:
      "var(--popover, var(--mira-popover, var(--mira-widget-background)))",
  },
  ".cm-tooltip .cm-tooltip-arrow:before": {
    borderBottomColor: "var(--border, var(--mira-border))",
    borderTopColor: "var(--border, var(--mira-border))",
  },
});

/**
 * Active line is off by default. Set `--mira-active-line-background`
 * (e.g. to `var(--mira-accent-soft)`) to restore highlighting. Must use
 * baseTheme so `&light`/`&dark` can target CM's built-in rules; `.mira-codemirror`
 * raises specificity so mount order cannot leave the stock blue highlight visible.
 */
const miraActiveLineBaseTheme = EditorView.baseTheme({
  "&light.mira-codemirror .cm-activeLine": {
    backgroundColor: "var(--mira-active-line-background, transparent)",
  },
  "&dark.mira-codemirror .cm-activeLine": {
    backgroundColor: "var(--mira-active-line-background, transparent)",
  },
  "&light.mira-codemirror .cm-activeLineGutter": {
    backgroundColor: "var(--mira-active-line-background, transparent)",
  },
  "&dark.mira-codemirror .cm-activeLineGutter": {
    backgroundColor: "var(--mira-active-line-background, transparent)",
  },
});

/** Overrides CM baseTheme light/dark completion selection colors. */
const miraAutocompleteBaseTheme = EditorView.baseTheme({
  "&light .cm-tooltip": {
    backgroundColor:
      "var(--popover, var(--mira-popover, var(--mira-widget-background)))",
    border: "1px solid var(--border, var(--mira-border))",
    color:
      "var(--popover-foreground, var(--mira-popover-foreground, var(--mira-foreground)))",
  },
  "&dark .cm-tooltip": {
    backgroundColor:
      "var(--popover, var(--mira-popover, var(--mira-widget-background)))",
    border: "1px solid var(--border, var(--mira-border))",
    color:
      "var(--popover-foreground, var(--mira-popover-foreground, var(--mira-foreground)))",
  },
  "&light .cm-tooltip-autocomplete ul li[aria-selected]": {
    backgroundColor:
      "var(--accent, var(--background-modifier-hover, var(--mira-accent-soft)))",
    color: "var(--accent-foreground, var(--mira-foreground))",
  },
  "&dark .cm-tooltip-autocomplete ul li[aria-selected]": {
    backgroundColor:
      "var(--accent, var(--background-modifier-hover, var(--mira-accent-soft)))",
    color: "var(--accent-foreground, var(--mira-foreground))",
  },
  "&light .cm-tooltip-autocomplete-disabled ul li[aria-selected]": {
    backgroundColor: "var(--muted, var(--mira-muted))",
    color: "var(--muted-foreground, var(--mira-muted-foreground))",
  },
  "&dark .cm-tooltip-autocomplete-disabled ul li[aria-selected]": {
    backgroundColor: "var(--muted, var(--mira-muted))",
    color: "var(--muted-foreground, var(--mira-muted-foreground))",
  },
});

type VisibleLineStyle = {
  top: number;
  bottom: number;
  lineHeight: string;
  paddingTop: string;
};

type MeasuredGutterElement = {
  element: HTMLElement;
  top: number;
  bottom: number;
};

function collectVisibleLineStyles(view: EditorView): VisibleLineStyle[] {
  return Array.from(
    view.dom.querySelectorAll<HTMLElement>(".cm-content .cm-line"),
    (line) => {
      const style = getComputedStyle(line);
      const rect = line.getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.bottom,
        lineHeight: style.lineHeight,
        paddingTop: style.paddingTop,
      };
    },
  );
}

function collectGutterColumns(view: EditorView): MeasuredGutterElement[][] {
  return Array.from(
    view.dom.querySelectorAll<HTMLElement>(".cm-gutters .cm-gutter"),
    (gutter) =>
      Array.from(
        gutter.querySelectorAll<HTMLElement>(".cm-gutterElement"),
        (element) => {
          const rect = element.getBoundingClientRect();
          return {
            element,
            top: rect.top,
            bottom: rect.bottom,
          };
        },
      ),
  );
}

function mutationMayAffectGutters(mutation: MutationRecord): boolean {
  if (mutation.type === "attributes") {
    return mutation.attributeName === "class";
  }

  return mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0;
}

function findMatchingLineStyle(
  gutterElement: MeasuredGutterElement,
  lineStyles: VisibleLineStyle[],
): VisibleLineStyle | null {
  let bestMatch: VisibleLineStyle | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const lineStyle of lineStyles) {
    const overlaps =
      gutterElement.top < lineStyle.bottom &&
      gutterElement.bottom > lineStyle.top;
    if (overlaps) {
      return lineStyle;
    }

    const distance = Math.abs(gutterElement.top - lineStyle.top);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = lineStyle;
    }
  }

  return bestMatch;
}

class GutterLineStyleSyncPlugin implements PluginValue {
  private readonly mutationObserver: MutationObserver;

  private readonly resizeObserver: ResizeObserver;

  private syncScheduled = false;

  constructor(private readonly view: EditorView) {
    this.mutationObserver = new MutationObserver((mutations) => {
      if (mutations.some(mutationMayAffectGutters)) {
        this.scheduleSync();
      }
    });

    this.mutationObserver.observe(this.view.dom, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    this.resizeObserver = new ResizeObserver(() => {
      this.scheduleSync();
    });
    this.resizeObserver.observe(this.view.dom);
    this.resizeObserver.observe(this.view.contentDOM);

    this.scheduleSync();
  }

  update(update: ViewUpdate): void {
    if (update.docChanged || update.viewportChanged || update.geometryChanged) {
      this.scheduleSync();
    }
  }

  destroy(): void {
    this.mutationObserver.disconnect();
    this.resizeObserver.disconnect();
  }

  private scheduleSync(): void {
    if (this.syncScheduled) {
      return;
    }

    this.syncScheduled = true;
    this.view.requestMeasure({
      read: (view) => ({
        lineStyles: collectVisibleLineStyles(view),
        gutterColumns: collectGutterColumns(view),
      }),
      write: ({ lineStyles, gutterColumns }) => {
        this.syncScheduled = false;
        this.applyLineStyles(lineStyles, gutterColumns);
      },
    });
  }

  private applyLineStyles(
    lineStyles: VisibleLineStyle[],
    gutterColumns: MeasuredGutterElement[][],
  ): void {
    for (const gutterElements of gutterColumns) {
      for (const gutterElement of gutterElements) {
        const lineStyle = findMatchingLineStyle(gutterElement, lineStyles);

        if (!lineStyle) {
          gutterElement.element.style.removeProperty("line-height");
          gutterElement.element.style.removeProperty("padding-top");
          continue;
        }

        if (gutterElement.element.style.lineHeight !== lineStyle.lineHeight) {
          gutterElement.element.style.lineHeight = lineStyle.lineHeight;
        }

        if (gutterElement.element.style.paddingTop !== lineStyle.paddingTop) {
          gutterElement.element.style.paddingTop = lineStyle.paddingTop;
        }
      }
    }
  }
}

export function gutterLineStyleSyncExtension(): Extension {
  return ViewPlugin.fromClass(GutterLineStyleSyncPlugin);
}

export function createBaseCodeMirrorExtensions(
  options: MiraCodeMirrorOptions = {},
): Extension[] {
  const indentWidth = normalizeIndentWidth(options.indentWidth);
  const readonly = options.readonly ?? false;
  const autocompleteConfig = options.autocomplete;

  return [
    miraEditorTheme,
    miraActiveLineBaseTheme,
    miraAutocompleteBaseTheme,
    gutterLineStyleSyncExtension(),
    ...((options.lineNumbers ?? true) ? [lineNumbers()] : []),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    EditorState.readOnly.of(readonly),
    EditorView.editable.of(!readonly),
    EditorView.contentAttributes.of({
      "aria-label": "Markdown editor",
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
            tooltipClass: () => "mira-cm-autocomplete",
            ...(autocompleteConfig ?? {}),
          }),
        ]),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    createMiraSearchExtension(options.search),
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
