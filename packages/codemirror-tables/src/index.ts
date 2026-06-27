import type { Extension, Range } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  type PluginValue,
  ViewPlugin,
  type ViewUpdate,
  type EditorView,
} from "@codemirror/view";

export type MarkdownTable = {
  header: string[];
  align: Array<"left" | "center" | "right" | null>;
  rows: string[][];
};

const tableLineDecoration = Decoration.line({
  class: "cm-markdown-table-line",
});

export function createTableExtensions(): Extension[] {
  return [markdownTableLineDecorations()];
}

export function parseMarkdownTable(markdown: string): MarkdownTable | null {
  const lines = markdown
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const possibleSeparatorLine = lines[1];
  if (
    lines.length < 2 ||
    !possibleSeparatorLine ||
    !isSeparatorLine(possibleSeparatorLine)
  ) {
    return null;
  }

  const headerLine = lines[0] ?? "";
  const separatorLine = lines[1] ?? "";
  const header = splitRow(headerLine);
  const separator = splitRow(separatorLine);
  const rows = lines.slice(2).map(splitRow);

  return {
    header,
    align: separator.map(parseAlignment),
    rows,
  };
}

export function formatMarkdownTable(table: MarkdownTable): string {
  const widths = table.header.map((cell, index) =>
    Math.max(
      cell.length,
      alignmentMarker(table.align[index] ?? null).length,
      ...table.rows.map((row) => row[index]?.length ?? 0),
    ),
  );

  const renderRow = (row: string[]) =>
    `| ${widths.map((width, index) => (row[index] ?? "").padEnd(width)).join(" | ")} |`;

  return [
    renderRow(table.header),
    `| ${widths
      .map((width, index) =>
        alignmentMarker(table.align[index] ?? null).padEnd(width, "-"),
      )
      .join(" | ")} |`,
    ...table.rows.map(renderRow),
  ].join("\n");
}

function markdownTableLineDecorations(): Extension {
  return ViewPlugin.fromClass(MarkdownTableLineDecorationPlugin, {
    decorations: (value) => value.decorations,
  });
}

class MarkdownTableLineDecorationPlugin implements PluginValue {
  decorations: DecorationSet;

  constructor(private readonly view: EditorView) {
    this.decorations = buildTableLineDecorations(view);
  }

  update(update: ViewUpdate): void {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = buildTableLineDecorations(update.view);
    }
  }
}

function buildTableLineDecorations(view: EditorView): DecorationSet {
  const ranges: Range<Decoration>[] = [];

  for (const visibleRange of view.visibleRanges) {
    let line = view.state.doc.lineAt(visibleRange.from);
    while (line.from <= visibleRange.to) {
      if (looksLikeTableLine(line.text)) {
        ranges.push(tableLineDecoration.range(line.from));
      }

      if (line.to >= visibleRange.to || line.number >= view.state.doc.lines) {
        break;
      }
      line = view.state.doc.line(line.number + 1);
    }
  }

  return Decoration.set(ranges, true);
}

function splitRow(line: string): string[] {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function looksLikeTableLine(line: string): boolean {
  return /^\s*\|.+\|\s*$/.test(line);
}

function isSeparatorLine(line: string): boolean {
  return splitRow(line).every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseAlignment(value: string): MarkdownTable["align"][number] {
  if (value.startsWith(":") && value.endsWith(":")) {
    return "center";
  }
  if (value.endsWith(":")) {
    return "right";
  }
  if (value.startsWith(":")) {
    return "left";
  }
  return null;
}

function alignmentMarker(align: MarkdownTable["align"][number]): string {
  if (align === "center") {
    return ":---:";
  }
  if (align === "right") {
    return "---:";
  }
  if (align === "left") {
    return ":---";
  }
  return "---";
}
