import { syntaxTree } from "@codemirror/language";
import { type Extension, type Line, type Range } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  type PluginValue,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { sortRanges } from "./ranges";

type IndentSegment = {
  text: string;
  guide: boolean;
};

type MiraLineIndentLayout = {
  contentFrom: number;
  depth: number;
  fallbackColumns: number;
  guideCount: number;
  indentColumns: number;
  indentText: string;
  kind: "plain" | "quote" | "quote-list" | "ul" | "ol";
  listKind?: "ul" | "ol";
  markerFrom?: number;
  markerTo?: number;
  quoteFrom?: number;
  quoteTo?: number;
};

export type MiraIndentInfo = {
  columns: number;
  depth: number;
  kind: "plain" | "ul" | "ol";
  text: string;
};

const INDENT_UNIT = 4;

export function toMarkdownColumns(text: string): number {
  let columns = 0;
  for (const char of text) {
    if (char === "\t") {
      columns += INDENT_UNIT - (columns % INDENT_UNIT || 0);
      continue;
    }
    columns += 1;
  }
  return columns;
}

export function normalizeIndentText(text: string): string {
  let columns = 0;
  let normalized = "";
  for (const char of text) {
    if (char === "\t") {
      const tabWidth = INDENT_UNIT - (columns % INDENT_UNIT || 0);
      normalized += " ".repeat(tabWidth);
      columns += tabWidth;
      continue;
    }
    normalized += char;
    columns += 1;
  }
  return normalized;
}

export function splitIndentSegments(indentText: string): IndentSegment[] {
  const normalized = normalizeIndentText(indentText);
  const segments: IndentSegment[] = [];
  for (let index = 0; index < normalized.length; index += INDENT_UNIT) {
    const text = normalized.slice(index, index + INDENT_UNIT);
    segments.push({ text, guide: text.length === INDENT_UNIT });
  }
  return segments;
}

export function getLineIndentInfo(lineText: string): MiraIndentInfo | null {
  const listMatch = lineText.match(/^(\s*)([-*+]|\d+[.)])\s+/);
  if (listMatch) {
    const indentText = listMatch[1] ?? "";
    const columns = toMarkdownColumns(indentText);
    return {
      columns,
      depth: Math.max(1, Math.floor(columns / INDENT_UNIT) + 1),
      kind: /^\d/u.test(listMatch[2] ?? "") ? "ol" : "ul",
      text: indentText,
    };
  }

  const plainMatch = lineText.match(/^(\s+)(?=\S)/);
  if (!plainMatch) {
    return null;
  }

  const indentText = plainMatch[1] ?? "";
  const columns = toMarkdownColumns(indentText);
  if (columns < 1) {
    return null;
  }

  return {
    columns,
    depth: Math.max(1, Math.ceil(columns / INDENT_UNIT)),
    kind: "plain",
    text: indentText,
  };
}

export function selectionTouchesIndent(
  selectionFrom: number,
  selectionTo: number,
  indentFrom: number,
  indentTo: number,
): boolean {
  if (selectionFrom === selectionTo) {
    return selectionFrom >= indentFrom && selectionFrom <= indentTo;
  }
  return selectionFrom < indentTo && selectionTo > indentFrom;
}

export function getIndentLineLayout(
  lineText: string,
): MiraLineIndentLayout | null {
  const leading = lineText.match(/^\s*/u)?.[0] ?? "";
  const quote = lineText.slice(leading.length).match(/^(?:>\s*)+/u)?.[0] ?? "";
  const structuredOffset = leading.length + quote.length;
  const list = lineText.slice(structuredOffset).match(/^([-*+]|\d+[.)])(\s+)/u);

  if (list) {
    const marker = `${list[1] ?? ""}${list[2] ?? ""}`;
    const markerFrom = structuredOffset;
    const markerTo = markerFrom + marker.length;
    const task = lineText.slice(markerTo).match(/^(\[[^\]]\]\s+)/u)?.[0] ?? "";
    const prefixTo = markerTo + task.length;
    const indentColumns = toMarkdownColumns(leading);
    const listKind = /^\d/u.test(list[1] ?? "") ? "ol" : "ul";
    return {
      contentFrom: prefixTo,
      depth: Math.max(1, Math.floor(indentColumns / INDENT_UNIT) + 1),
      fallbackColumns: toMarkdownColumns(lineText.slice(0, prefixTo)),
      guideCount: Math.max(0, Math.floor(indentColumns / INDENT_UNIT)),
      indentColumns,
      indentText: leading,
      kind: quote ? "quote-list" : listKind,
      listKind,
      markerFrom,
      markerTo,
      ...(quote
        ? {
            quoteFrom: leading.length,
            quoteTo: structuredOffset,
          }
        : {}),
    };
  }

  if (quote) {
    const prefixTo = structuredOffset;
    return {
      contentFrom: prefixTo,
      depth: 1,
      fallbackColumns: toMarkdownColumns(lineText.slice(0, prefixTo)),
      guideCount: Math.max(
        0,
        Math.floor(toMarkdownColumns(leading) / INDENT_UNIT),
      ),
      indentColumns: toMarkdownColumns(leading),
      indentText: lineText.slice(0, prefixTo),
      kind: "quote",
      quoteFrom: leading.length,
      quoteTo: prefixTo,
    };
  }

  const plain = getLineIndentInfo(lineText);
  if (!plain || plain.kind !== "plain") {
    return null;
  }
  return {
    contentFrom: plain.text.length,
    depth: plain.depth,
    fallbackColumns: plain.columns,
    guideCount: Math.max(0, Math.floor(plain.columns / INDENT_UNIT)),
    indentColumns: plain.columns,
    indentText: plain.text,
    kind: "plain",
  };
}

function fallbackLength(columns: number, adjustment?: string): string {
  return adjustment ? `calc(${columns}ch + ${adjustment})` : `${columns}ch`;
}

function buildIndentStyle(layout: MiraLineIndentLayout): string {
  const markerColumns =
    layout.markerFrom === undefined || layout.markerTo === undefined
      ? 0
      : layout.markerTo - layout.markerFrom;
  const markerAdjustment =
    layout.listKind === "ul"
      ? `var(--hmd-unordered-list-marker-slot-width, ${markerColumns}ch) - ${markerColumns}ch`
      : undefined;
  const fallback = fallbackLength(layout.fallbackColumns, markerAdjustment);
  return [
    layout.guideCount > 0 ? `--indent-guide-count: ${layout.guideCount};` : "",
    layout.listKind === "ul"
      ? "--hmd-indent-guide-offset: var(--hmd-unordered-list-marker-guide-offset, 0px);"
      : "",
    `--hmd-indent-padding-fallback: ${fallback};`,
    `--hmd-indent-prefix-fallback: ${fallback};`,
  ]
    .filter(Boolean)
    .join(" ");
}

class IndentGuideWidget extends WidgetType {
  constructor(
    private readonly segments: IndentSegment[],
    private readonly plain: boolean,
  ) {
    super();
  }

  override eq(other: IndentGuideWidget): boolean {
    return (
      this.plain === other.plain &&
      JSON.stringify(this.segments) === JSON.stringify(other.segments)
    );
  }

  override toDOM(): HTMLElement {
    const guideCount = this.segments.filter((segment) => segment.guide).length;
    const root = document.createElement("span");
    root.className = [
      "cm-hmd-list-indent",
      `cm-hmd-list-indent-${guideCount}`,
      this.plain ? "cm-plain-indent-widget" : "",
    ]
      .filter(Boolean)
      .join(" ");
    root.setAttribute("aria-hidden", "true");

    for (const segment of this.segments) {
      const indent = document.createElement("span");
      indent.className = [
        "cm-indent",
        segment.guide ? "cm-indent-guide" : "cm-indent-spacer",
      ].join(" ");
      indent.textContent = segment.text;
      root.append(indent);
    }

    return root;
  }

  override ignoreEvent(): boolean {
    return true;
  }
}

export function indentGuideDecorations(): Extension {
  return ViewPlugin.fromClass(
    class implements PluginValue {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.createDecorations(view);
      }

      update(update: ViewUpdate): void {
        if (
          update.docChanged ||
          update.viewportChanged ||
          update.selectionSet ||
          update.focusChanged
        ) {
          this.decorations = this.createDecorations(update.view);
        }
      }

      private createDecorations(view: EditorView): DecorationSet {
        const decorations: Range<Decoration>[] = [];
        const cursor = view.state.selection.main;

        for (const { from, to } of view.visibleRanges) {
          let line = view.state.doc.lineAt(from);
          while (line.from <= to) {
            const layout = getIndentLineLayout(line.text);
            if (layout && isMarkdownIndentLine(view, line, layout)) {
              const indentTo = line.from + layout.indentText.length;
              const anchorFrom =
                layout.kind === "plain"
                  ? findPlainIndentAnchor(
                      view,
                      line.number,
                      layout.indentColumns,
                    )
                  : null;
              decorations.push(
                Decoration.line({
                  attributes: {
                    "data-indent-prefix": layout.indentText,
                    "data-indent-fallback-columns": `${layout.fallbackColumns}`,
                    "data-indent-variant": layout.kind,
                    "data-line-from": `${line.from}`,
                    "data-list-depth": `${layout.depth}`,
                    ...(layout.listKind
                      ? { "data-list-kind": layout.listKind }
                      : {}),
                    ...(anchorFrom !== null
                      ? { "data-indent-anchor-line-from": `${anchorFrom}` }
                      : {}),
                    style: buildIndentStyle(layout),
                  },
                  class: [
                    "indented-wrapped-line",
                    layout.kind === "plain" ? "cm-plain-indent-line" : "",
                    layout.kind === "quote" || layout.kind === "quote-list"
                      ? "cm-blockquote"
                      : "",
                    layout.listKind || layout.kind === "plain"
                      ? "HyperMD-list-line"
                      : "",
                    layout.listKind || layout.kind === "plain"
                      ? `HyperMD-list-line-${layout.depth}`
                      : "",
                    "cm-formatting",
                    layout.listKind || layout.kind === "plain"
                      ? "cm-formatting-list"
                      : "",
                    layout.listKind === "ol"
                      ? "cm-formatting-list-ol"
                      : layout.listKind === "ul" || layout.kind === "plain"
                        ? "cm-formatting-list-ul"
                        : "",
                    layout.listKind || layout.kind === "plain"
                      ? `cm-list-${layout.depth}`
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" "),
                }).range(line.from),
              );

              if (
                layout.indentText.length > 0 &&
                !selectionTouchesIndent(
                  cursor.from,
                  cursor.to,
                  line.from,
                  indentTo,
                )
              ) {
                decorations.push(
                  Decoration.replace({
                    widget: new IndentGuideWidget(
                      splitIndentSegments(layout.indentText),
                      layout.kind === "plain",
                    ),
                  }).range(line.from, indentTo),
                );
              }

              if (
                layout.markerFrom !== undefined &&
                layout.markerTo !== undefined
              ) {
                decorations.push(
                  Decoration.mark({
                    class: [
                      "cm-formatting",
                      "cm-formatting-list",
                      layout.listKind === "ol"
                        ? "cm-formatting-list-ol"
                        : "cm-formatting-list-ul",
                      `cm-list-${layout.depth}`,
                    ].join(" "),
                  }).range(
                    line.from + layout.markerFrom,
                    line.from + layout.markerTo,
                  ),
                );
              }

              if (
                layout.quoteFrom !== undefined &&
                layout.quoteTo !== undefined
              ) {
                decorations.push(
                  Decoration.mark({
                    class: "cm-formatting-quote cm-blockquote-border",
                  }).range(
                    line.from + layout.quoteFrom,
                    line.from + layout.quoteTo,
                  ),
                );
              }

              if (layout.contentFrom < line.text.length) {
                decorations.push(
                  Decoration.mark({
                    class: `cm-list-${layout.depth}`,
                  }).range(line.from + layout.contentFrom, line.to),
                );
              }
            }

            if (line.number >= view.state.doc.lines) {
              break;
            }
            line = view.state.doc.line(line.number + 1);
          }
        }

        return Decoration.set(sortRanges(decorations));
      }
    },
    {
      decorations: (plugin) => plugin.decorations,
    },
  );
}

function isMarkdownIndentLine(
  view: EditorView,
  line: Line,
  layout: MiraLineIndentLayout,
): boolean {
  if (!layout.listKind && layout.kind !== "quote") {
    return true;
  }

  let list = false;
  let quote = false;
  syntaxTree(view.state).iterate({
    from: line.from,
    to: line.to,
    enter(node) {
      list ||= node.name === "ListMark";
      quote ||= node.name === "QuoteMark";
    },
  });
  return layout.listKind ? list : quote;
}

function findPlainIndentAnchor(
  view: EditorView,
  lineNumber: number,
  indentColumns: number,
): number | null {
  for (
    let candidateNumber = lineNumber - 1;
    candidateNumber >= Math.max(1, lineNumber - 50);
    candidateNumber -= 1
  ) {
    const candidate = view.state.doc.line(candidateNumber);
    if (!candidate.text.trim()) {
      continue;
    }
    const layout = getIndentLineLayout(candidate.text);
    if (layout?.listKind) {
      return indentColumns < layout.fallbackColumns + INDENT_UNIT
        ? candidate.from
        : null;
    }
    if (!layout || layout.kind === "quote") {
      return null;
    }
  }
  return null;
}
