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
import { isFencedCodeLine } from "./code-block-lines";
import { sortRanges } from "./ranges";

type IndentSegment = {
  text: string;
  guide: boolean;
};

type PlainIndentAnchor = {
  fallbackPaddingAdjustment?: string;
  fallbackPaddingColumns: number;
  guideOffset?: string;
  lineFrom: number;
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
      // Lapis list/plain-indent only replace leading whitespace; `>` stays
      // visible until live-preview rich decorations style/hide it.
      indentText: leading,
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
  if (columns <= 0 && !adjustment) {
    return "";
  }
  return adjustment
    ? `calc(${Math.max(columns, 0)}ch + ${adjustment})`
    : `${columns}ch`;
}

function unorderedMarkerAdjustment(markerColumns: number): string {
  return `var(--hmd-unordered-list-marker-slot-width, ${Math.max(markerColumns, 0)}ch) - ${Math.max(markerColumns, 0)}ch`;
}

function buildIndentStyle(
  layout: MiraLineIndentLayout,
  anchor: PlainIndentAnchor | null,
): string {
  const markerColumns =
    layout.markerFrom === undefined || layout.markerTo === undefined
      ? 0
      : layout.markerTo - layout.markerFrom;
  const listMarkerAdjustment =
    layout.listKind === "ul"
      ? unorderedMarkerAdjustment(markerColumns)
      : undefined;
  const paddingFallback = fallbackLength(
    anchor?.fallbackPaddingColumns ?? layout.fallbackColumns,
    anchor?.fallbackPaddingAdjustment ?? listMarkerAdjustment,
  );
  const prefixFallback = fallbackLength(
    layout.fallbackColumns,
    listMarkerAdjustment,
  );
  return [
    layout.guideCount > 0 ? `--indent-guide-count: ${layout.guideCount};` : "",
    anchor?.guideOffset || layout.listKind === "ul"
      ? `--hmd-indent-guide-offset: ${anchor?.guideOffset ?? "var(--hmd-unordered-list-marker-guide-offset, 0px)"};`
      : "",
    paddingFallback ? `--hmd-indent-padding-fallback: ${paddingFallback};` : "",
    prefixFallback ? `--hmd-indent-prefix-fallback: ${prefixFallback};` : "",
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

export function indentGuideDecorations(
  options: { livePreview?: boolean } = {},
): Extension {
  const livePreview = options.livePreview ?? true;
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
              // Pure quote chrome (`>`, blockquote border) is live-preview-only
              // in Lapis (RichEditPlugin). Source keeps literal `>` text.
              if (!livePreview && layout.kind === "quote") {
                if (line.number >= view.state.doc.lines) {
                  break;
                }
                line = view.state.doc.line(line.number + 1);
                continue;
              }

              const indentTo = line.from + layout.indentText.length;
              const anchor =
                layout.kind === "plain"
                  ? findPlainIndentAnchor(view, line, layout.indentColumns)
                  : null;
              const quoteChrome =
                livePreview &&
                (layout.kind === "quote" || layout.kind === "quote-list");
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
                    ...(anchor
                      ? {
                          "data-indent-anchor-line-from": `${anchor.lineFrom}`,
                        }
                      : {}),
                    style: buildIndentStyle(layout, anchor),
                  },
                  class: [
                    "indented-wrapped-line",
                    layout.kind === "plain" ? "cm-plain-indent-line" : "",
                    quoteChrome ? "cm-blockquote" : "",
                    layout.listKind || layout.kind === "plain"
                      ? "HyperMD-list-line"
                      : "",
                    layout.listKind || layout.kind === "plain"
                      ? `HyperMD-list-line-${layout.depth}`
                      : "",
                    !layout.listKind ? "cm-formatting" : "",
                    layout.kind === "plain" ? "cm-formatting-list" : "",
                    layout.kind === "plain" ? "cm-formatting-list-ul" : "",
                    layout.kind === "plain" ? `cm-list-${layout.depth}` : "",
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
                livePreview &&
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
  // Fenced code keeps literal leading whitespace + the shared 24px fence
  // padding. Hanging-indent chrome here pulls lines left of that padding
  // until the cursor sits on the indent and clears the replace widget.
  if (isFencedCodeLine(view.state, line.number)) {
    return false;
  }

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

export function shouldAnchorPlainIndentToListItem(
  indentColumns: number,
  parentContentColumns: number,
): boolean {
  return indentColumns < parentContentColumns + INDENT_UNIT;
}

function getMarkerEnd(
  lineText: string,
  lineFrom: number,
  markerFrom: number,
  markerTo: number,
): number {
  const markerOffset = markerFrom - lineFrom;
  const spaceOffset = lineText.indexOf(" ", markerOffset);
  return spaceOffset === -1 ? markerTo : lineFrom + spaceOffset + 1;
}

function getListPrefixEndFromText(
  remainder: string,
  markerEnd: number,
): number {
  const task = remainder.match(/^(\[[^\]]\]\s+)/u)?.[0] ?? "";
  return markerEnd + task.length;
}

function findPlainIndentAnchor(
  view: EditorView,
  line: Line,
  indentColumns: number,
): PlainIndentAnchor | null {
  const tree = syntaxTree(view.state);
  const node = tree.resolve(line.from, 1);

  for (
    let current: typeof node | null = node;
    current;
    current = current.parent
  ) {
    if (current.name !== "ListItem") {
      continue;
    }

    const list = current.parent;
    if (!list || (list.name !== "BulletList" && list.name !== "OrderedList")) {
      continue;
    }

    const listMark = current.getChild("ListMark");
    if (!listMark) {
      return null;
    }

    const anchorLine = view.state.doc.lineAt(listMark.from);
    if (anchorLine.from === line.from) {
      return null;
    }

    const markerEnd = getMarkerEnd(
      anchorLine.text,
      anchorLine.from,
      listMark.from,
      listMark.to,
    );
    const prefixEnd = getListPrefixEndFromText(
      view.state.sliceDoc(markerEnd, anchorLine.to),
      markerEnd,
    );
    const fallbackPaddingColumns = toMarkdownColumns(
      view.state.sliceDoc(anchorLine.from, prefixEnd),
    );
    if (
      !shouldAnchorPlainIndentToListItem(indentColumns, fallbackPaddingColumns)
    ) {
      return null;
    }

    if (list.name === "BulletList") {
      const markerColumns = toMarkdownColumns(
        view.state.sliceDoc(listMark.from, markerEnd),
      );
      return {
        fallbackPaddingAdjustment: unorderedMarkerAdjustment(markerColumns),
        fallbackPaddingColumns,
        guideOffset: "var(--hmd-unordered-list-marker-guide-offset, 0px)",
        lineFrom: anchorLine.from,
      };
    }

    return { fallbackPaddingColumns, lineFrom: anchorLine.from };
  }

  return null;
}
