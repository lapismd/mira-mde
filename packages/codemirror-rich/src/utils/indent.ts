import { type Extension, type Range } from "@codemirror/state";
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

class IndentGuideWidget extends WidgetType {
  constructor(private readonly segments: IndentSegment[]) {
    super();
  }

  override eq(other: IndentGuideWidget): boolean {
    return JSON.stringify(this.segments) === JSON.stringify(other.segments);
  }

  override toDOM(): HTMLElement {
    const guideCount = this.segments.filter((segment) => segment.guide).length;
    const root = document.createElement("span");
    root.className = `cm-hmd-list-indent cm-hmd-list-indent-${guideCount}`;
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
            const indent = getLineIndentInfo(line.text);
            if (indent?.text) {
              const indentTo = line.from + indent.text.length;
              const guideCount = Math.max(0, Math.floor(indent.columns / 4));
              const style = [
                guideCount > 0 ? `--indent-guide-count: ${guideCount};` : "",
                `--hmd-indent-padding-fallback: ${indent.columns}ch;`,
                `--hmd-indent-prefix-fallback: ${indent.columns}ch;`,
              ]
                .filter(Boolean)
                .join(" ");

              decorations.push(
                Decoration.line({
                  attributes: {
                    "data-indent-prefix": indent.text,
                    "data-indent-variant": indent.kind,
                    "data-line-from": `${line.from}`,
                    "data-list-depth": `${indent.depth}`,
                    style,
                  },
                  class: [
                    "indented-wrapped-line",
                    indent.kind === "plain"
                      ? "cm-plain-indent-line"
                      : "HyperMD-list-line",
                    `HyperMD-list-line-${indent.depth}`,
                    "cm-formatting",
                    "cm-formatting-list",
                    indent.kind === "ol"
                      ? "cm-formatting-list-ol"
                      : "cm-formatting-list-ul",
                    `cm-list-${indent.depth}`,
                  ].join(" "),
                }).range(line.from),
              );

              if (
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
                      splitIndentSegments(indent.text),
                    ),
                  }).range(line.from, indentTo),
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
