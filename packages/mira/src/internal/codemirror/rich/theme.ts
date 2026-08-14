import { EditorView } from "@codemirror/view";

export const miraRichEditorTheme = EditorView.theme({
  ".cm-foldGutter": {
    display: "none",
  },
  ".cm-line": {
    position: "relative",
  },
  ".cm-hmd-list-indent": {
    display: "inline-flex",
    whiteSpace: "pre",
  },
  ".cm-indent": {
    display: "inline-block",
    position: "relative",
    whiteSpace: "pre",
  },
  ".cm-indent-guide::before": {
    borderInlineStart:
      "var(--markdown-indentation-guide-width, var(--indentation-guide-width, 1px)) solid var(--markdown-indentation-guide-color, var(--indentation-guide-color, var(--mira-border)))",
    content: "''",
    insetBlock: "0",
    insetInlineStart:
      "calc(50% - var(--markdown-indentation-guide-width, var(--indentation-guide-width, 1px)) / 2)",
    pointerEvents: "none",
    position: "absolute",
  },
  ".cm-indent-guide.is-active::before": {
    borderInlineStartColor:
      "var(--markdown-indentation-guide-color-active, var(--indentation-guide-color-active, var(--mira-border-strong)))",
    borderInlineStartWidth:
      "var(--markdown-indentation-guide-width-active, var(--indentation-guide-width-active, 1px))",
  },
  ".cm-plain-indent-widget": {
    display: "inline-flex",
  },
  ".mira-fold-indicator": {
    alignItems: "center",
    display: "inline-flex",
    height: "1rem",
    justifyContent: "center",
    marginInlineEnd: "0.15rem",
    marginInlineStart: "-1.15rem",
    position: "relative",
    verticalAlign: "-0.1rem",
    width: "1rem",
  },
  ".mira-fold-indicator__button": {
    alignItems: "center",
    background: "transparent",
    border: "0",
    borderRadius: "4px",
    color: "var(--mira-muted-foreground)",
    cursor: "pointer",
    display: "inline-flex",
    height: "1rem",
    justifyContent: "center",
    padding: "0",
    width: "1rem",
  },
  ".mira-fold-indicator__button:hover": {
    background: "var(--mira-accent-soft)",
    color: "var(--mira-foreground)",
  },
  ".mira-fold-indicator__icon": {
    display: "block",
    height: "0.875rem",
    transform: "rotate(0deg)",
    transition: "transform 120ms ease",
    width: "0.875rem",
  },
  ".mira-fold-indicator__button[data-folded='true'] .mira-fold-indicator__icon":
    {
      transform: "rotate(-90deg)",
    },
  // Collapse hidden marks only in live preview (Lapis richEditor scope).
  "&.cm-live-preview .cm-formatting-hidden": {
    color: "transparent",
    display: "inline-block",
    height: "0",
    lineHeight: "0",
    overflow: "hidden",
    width: "0",
  },
  // Only hide the host editor caret — nested `.mod-inline` table cell
  // editors live under the same scroller and must keep their cursor layer.
  "&.mira-live-preview-hide-cursor > .cm-scroller > .cm-cursorLayer": {
    visibility: "hidden",
  },
  ".mira-rich-widget": {
    background: "var(--mira-widget-background, transparent)",
    boxSizing: "border-box",
    color: "var(--mira-foreground)",
    margin: "0",
    overflow: "visible",
    position: "relative",
  },
  ".mira-rich-widget--block": {
    cursor: "default",
    maxWidth: "100%",
    overflowWrap: "normal",
    whiteSpace: "normal",
    width: "100%",
    wordBreak: "normal",
  },
  ".mira-rich-widget__source-toggle": {
    alignItems: "center",
    background: "var(--mira-popover)",
    border: "1px solid var(--mira-border)",
    borderRadius: "4px",
    boxShadow: "var(--mira-widget-shadow)",
    color: "var(--mira-muted-foreground)",
    cursor: "pointer",
    display: "inline-flex",
    height: "1.5rem",
    insetBlockStart: "0.25rem",
    insetInlineEnd: "0.25rem",
    justifyContent: "center",
    lineHeight: "1",
    opacity: "0",
    padding: "0",
    position: "absolute",
    transition: "opacity 120ms ease, color 120ms ease",
    width: "1.5rem",
    zIndex: "10",
  },
  ".mira-rich-widget__source-icon": {
    height: "0.95rem",
    width: "0.95rem",
  },
  ".mira-rich-widget:hover .mira-rich-widget__source-toggle, .mira-rich-widget:focus-within .mira-rich-widget__source-toggle":
    {
      opacity: "1",
    },
  ".mira-rich-widget__source-toggle:hover": {
    background: "var(--mira-accent-soft)",
    color: "var(--mira-foreground)",
  },
  ".mira-table-widget-shell": {
    display: "inline-block",
    maxWidth: "100%",
    position: "relative",
  },
  ".mira-table-widget__source-toggle": {
    alignItems: "center",
    background: "var(--mira-popover)",
    border: "1px solid var(--mira-border)",
    borderRadius: "4px",
    boxShadow: "var(--mira-widget-shadow)",
    color: "var(--mira-muted-foreground)",
    cursor: "pointer",
    display: "inline-flex",
    height: "1.5rem",
    insetBlockStart: "0.25rem",
    insetInlineEnd: "0.25rem",
    justifyContent: "center",
    lineHeight: "1",
    opacity: "0",
    padding: "0",
    position: "absolute",
    transition: "opacity 120ms ease, color 120ms ease",
    width: "1.5rem",
    zIndex: "10",
  },
  ".mira-table-widget-shell:hover .mira-table-widget__source-toggle, .mira-table-widget-shell:focus-within .mira-table-widget__source-toggle":
    {
      opacity: "1",
    },
  ".mira-table-widget__source-toggle svg": {
    height: "0.95rem",
    width: "0.95rem",
  },
  ".mira-table-widget__source-toggle:hover": {
    background: "var(--mira-accent-soft)",
    color: "var(--mira-foreground)",
  },
  ".mira-rich-widget .mira-markdown-preview": {
    background: "transparent",
    height: "auto",
    margin: "0",
    overflow: "visible",
    padding: "0.1rem 0",
  },
  ".mira-rich-widget .markdown-rendered, .mira-rich-widget .markdown-rendered > *":
    {
      marginBlockEnd: "0",
      marginBlockStart: "0",
    },
  ".mira-rich-widget--table": {
    borderColor: "transparent",
    minHeight: "0 !important",
  },
  ".mira-rich-widget--table:hover": {
    borderColor: "transparent",
  },
  ".cm-header": {
    fontFamily: "var(--mira-font-sans)",
    lineHeight: "var(--cm-block-line-height)",
  },
  ".cm-header-1": {
    "--cm-block-line-height": "var(--mira-h1-line-height, 1.2)",
    color:
      "var(--mira-h1-color, var(--mira-heading-color, var(--mira-foreground)))",
    fontFamily: "var(--mira-h1-font, var(--mira-font-sans))",
    fontSize: "var(--mira-h1-size, 1.802em)",
    fontStyle: "var(--mira-h1-style, normal)",
    fontVariant: "var(--mira-h1-variant, normal)",
    fontWeight: "var(--mira-h1-weight, 700)",
  },
  ".cm-header-2": {
    "--cm-block-line-height": "var(--mira-h2-line-height, 1.2)",
    color:
      "var(--mira-h2-color, var(--mira-heading-color, var(--mira-foreground)))",
    fontFamily: "var(--mira-h2-font, var(--mira-font-sans))",
    fontSize: "var(--mira-h2-size, 1.602em)",
    fontStyle: "var(--mira-h2-style, normal)",
    fontVariant: "var(--mira-h2-variant, normal)",
    fontWeight: "var(--mira-h2-weight, 600)",
  },
  ".cm-header-3": {
    "--cm-block-line-height": "var(--mira-h3-line-height, 1.3)",
    color:
      "var(--mira-h3-color, var(--mira-heading-color, var(--mira-foreground)))",
    fontFamily: "var(--mira-h3-font, var(--mira-font-sans))",
    fontSize: "var(--mira-h3-size, 1.424em)",
    fontStyle: "var(--mira-h3-style, normal)",
    fontVariant: "var(--mira-h3-variant, normal)",
    fontWeight: "var(--mira-h3-weight, 600)",
  },
  ".cm-header-4": {
    "--cm-block-line-height": "var(--mira-h4-line-height, 1.4)",
    color:
      "var(--mira-h4-color, var(--mira-heading-color, var(--mira-foreground)))",
    fontFamily: "var(--mira-h4-font, var(--mira-font-sans))",
    fontSize: "var(--mira-h4-size, 1.266em)",
    fontStyle: "var(--mira-h4-style, normal)",
    fontVariant: "var(--mira-h4-variant, normal)",
    fontWeight: "var(--mira-h4-weight, 600)",
  },
  ".cm-header-5": {
    "--cm-block-line-height": "var(--mira-h5-line-height, 1.5)",
    color:
      "var(--mira-h5-color, var(--mira-heading-color, var(--mira-foreground)))",
    fontFamily: "var(--mira-h5-font, var(--mira-font-sans))",
    fontSize: "var(--mira-h5-size, 1.125em)",
    fontStyle: "var(--mira-h5-style, normal)",
    fontVariant: "var(--mira-h5-variant, normal)",
    fontWeight: "var(--mira-h5-weight, 600)",
  },
  ".cm-header-6": {
    "--cm-block-line-height": "var(--mira-h6-line-height, 1.5)",
    color:
      "var(--mira-h6-color, var(--mira-heading-color, var(--mira-foreground)))",
    fontFamily: "var(--mira-h6-font, var(--mira-font-sans))",
    fontSize: "var(--mira-h6-size, 1em)",
    fontStyle: "var(--mira-h6-style, normal)",
    fontVariant: "var(--mira-h6-variant, normal)",
    fontWeight: "var(--mira-h6-weight, 600)",
  },
  ".cm-gutters .cm-gutterElement.cm-gutterHeader": {
    display: "inline-flex",
    alignItems: "center",
  },
  ".cm-gutters .cm-gutterElement.cm-gutterHeader-1": {
    "--cm-block-line-height": "var(--mira-h1-line-height, 1.2)",
  },
  ".cm-gutters .cm-gutterElement.cm-gutterHeader-2": {
    "--cm-block-line-height": "var(--mira-h2-line-height, 1.2)",
  },
  ".cm-gutters .cm-gutterElement.cm-gutterHeader-3": {
    "--cm-block-line-height": "var(--mira-h3-line-height, 1.3)",
  },
  ".cm-gutters .cm-gutterElement.cm-gutterHeader-4": {
    "--cm-block-line-height": "var(--mira-h4-line-height, 1.4)",
  },
  ".cm-gutters .cm-gutterElement.cm-gutterHeader-5": {
    "--cm-block-line-height": "var(--mira-h5-line-height, 1.5)",
  },
  ".cm-gutters .cm-gutterElement.cm-gutterHeader-6": {
    "--cm-block-line-height": "var(--mira-h6-line-height, 1.5)",
  },
});
