import { tags } from "@lezer/highlight";
import type {
  BlockContext,
  Element,
  LeafBlock,
  LeafBlockParser,
  Line,
  MarkdownConfig,
} from "@lezer/markdown";

function parseRow(
  context: BlockContext,
  line: string,
  startIndex = 0,
  elements?: Element[],
  offset = 0,
): number {
  let count = 0;
  let first = true;
  let cellStart = -1;
  let cellEnd = -1;
  let escaped = false;

  const parseCell = () => {
    elements?.push(
      context.elt(
        "GridTableCell",
        offset + cellStart,
        offset + cellEnd,
        context.parser.parseInline(
          line.slice(cellStart, cellEnd),
          offset + cellStart,
        ),
      ),
    );
  };

  for (let index = startIndex; index < line.length; index += 1) {
    const next = line.charCodeAt(index);
    if (next === 43) {
      const rest = line.substring(index);
      if (isHorizontalSeparator(rest)) {
        elements?.push(
          context.elt(
            "GridTableDivider",
            index + offset,
            index + offset + rest.length,
          ),
        );
        return count;
      }
    } else if (next === 124 && !escaped) {
      if (!first || cellStart > -1) {
        count += 1;
      }
      first = false;
      if (cellStart > -1) {
        parseCell();
      }
      elements?.push(
        context.elt("GridTableDelimiter", index + offset, index + offset + 1),
      );
      cellStart = -1;
      cellEnd = -1;
    } else if (escaped || (next !== 32 && next !== 9)) {
      if (cellStart < 0) {
        cellStart = index;
      }
      cellEnd = index + 1;
    }
    escaped = !escaped && next === 92;
  }

  if (cellStart > -1) {
    count += 1;
    parseCell();
  }
  return count;
}

class GridTableParser implements LeafBlockParser {
  private readonly lines: string[] = [];

  private readonly rows: Element[] = [];

  isComplete = false;

  constructor(line: string) {
    this.lines.push(line);
  }

  nextLine(context: BlockContext, line: Line): boolean {
    const lineText = line.text.slice(line.pos);
    this.lines.push(lineText);

    const content: Element[] = [];
    if (isHorizontalSeparator(lineText)) {
      content.push(
        context.elt(
          "GridTableDelimiter",
          context.lineStart + line.pos,
          context.lineStart + line.text.length,
        ),
      );
    }

    parseRow(context, lineText.trim(), line.pos, content, context.lineStart);

    if (this.lines.length > 1) {
      const trimmed = lineText.trim();
      if (
        trimmed === "" ||
        (!this.isGridTableLine(trimmed) && this.lines.length > 2)
      ) {
        this.isComplete = true;
        return true;
      }
    }

    this.rows.push(...content);
    return false;
  }

  finish(context: BlockContext, leaf: LeafBlock): boolean {
    context.addLeafElement(
      leaf,
      context.elt("GridTable", leaf.start, leaf.start + leaf.content.length, [
        context.elt(
          "GridTableDelimiter",
          leaf.start,
          leaf.start + this.lines[0]!.length,
        ),
        ...this.rows,
      ]),
    );
    return true;
  }

  isGridTableLine(line: string): boolean {
    const trimmed = line.trim();
    if (!trimmed) {
      return false;
    }
    if (isHorizontalSeparator(trimmed)) {
      return true;
    }
    return (
      trimmed.includes("|") && (trimmed.startsWith("|") || /^\s*\|/.test(line))
    );
  }
}

const gridTableSeparatorPattern = /^(\+[:>]?[=-]+[vx^]?[=-]*[:<]?)+\+$/;

function hasGridTableMarker(value: string): boolean {
  return gridTableSeparatorPattern.test(value.trim());
}

function isHorizontalSeparator(line: string): boolean {
  return gridTableSeparatorPattern.test(line.trim());
}

export const GridTable: MarkdownConfig = {
  defineNodes: [
    { name: "GridTable", block: true },
    { name: "GridTableHeader", style: { "GridTableHeader/...": tags.heading } },
    "GridTableRow",
    { name: "GridTableCell", style: tags.content },
    { name: "GridTableDivider", style: tags.processingInstruction },
    { name: "GridTableDelimiter", style: tags.processingInstruction },
  ],
  parseBlock: [
    {
      name: "GridTable",
      leaf(_, leaf) {
        if (hasGridTableMarker(leaf.content)) {
          return new GridTableParser(leaf.content);
        }
        return null;
      },
      endLeaf(_, line, leaf) {
        const parser = leaf.parsers.find(
          (candidate) => candidate instanceof GridTableParser,
        ) as GridTableParser | undefined;
        if (!parser) {
          return false;
        }
        if (parser.isComplete) {
          return true;
        }
        const lineText = line.text.slice(line.pos).trim();
        return lineText === "" || !parser.isGridTableLine(lineText);
      },
      before: "Table",
    },
  ],
};
