const RICH_BLOCK_LINE_HEIGHT_ESTIMATE_PX = 25.5;
const RICH_BLOCK_VERTICAL_PADDING_ESTIMATE_PX = 16;
const RICH_MERMAID_WIDGET_MIN_HEIGHT_PX = 200;
const RICH_TABLE_ROW_HEIGHT_ESTIMATE_PX = 48;
const RICH_TABLE_WRAP_COLUMN_ESTIMATE_CHARS = 72;
const RICH_TABLE_WRAPPED_ROW_EXTRA_HEIGHT_PX = 40;

export function estimateMarkdownBlockHeight(markdown: string): number {
  const lineCount = countSourceLines(markdown);
  const trimmed = markdown.trimStart();
  const fencedCode = trimmed.match(/^(```|~~~)([^\r\n]*)/);

  if (fencedCode) {
    const language = fencedCode[2]?.trim().toLowerCase() ?? "";
    const bodyLineCount = Math.max(1, lineCount - 2);
    const baseHeight =
      bodyLineCount * RICH_BLOCK_LINE_HEIGHT_ESTIMATE_PX +
      RICH_BLOCK_VERTICAL_PADDING_ESTIMATE_PX * 2;

    if (language === "mermaid") {
      return Math.max(RICH_MERMAID_WIDGET_MIN_HEIGHT_PX, baseHeight);
    }

    return Math.max(64, baseHeight);
  }

  if (isPipeTableMarkdown(markdown)) {
    return estimateTableWidgetHeight(markdown);
  }

  if (/^\s*---(?:\r?\n|$)/.test(markdown)) {
    return Math.max(
      64,
      lineCount * RICH_BLOCK_LINE_HEIGHT_ESTIMATE_PX +
        RICH_BLOCK_VERTICAL_PADDING_ESTIMATE_PX,
    );
  }

  return Math.max(
    RICH_BLOCK_LINE_HEIGHT_ESTIMATE_PX,
    lineCount * RICH_BLOCK_LINE_HEIGHT_ESTIMATE_PX +
      RICH_BLOCK_VERTICAL_PADDING_ESTIMATE_PX,
  );
}

function countSourceLines(source: string): number {
  if (!source) {
    return 1;
  }

  return source.split(/\r\n|\r|\n/).length;
}

function isPipeTableMarkdown(markdown: string): boolean {
  const lines = markdown
    .trim()
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.length >= 2 && isTableSeparatorLine(lines[1] ?? "");
}

function isTableSeparatorLine(line: string): boolean {
  const cells = line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim())
    .filter(Boolean);

  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function estimateTableWidgetHeight(source: string): number {
  let height = 0;
  let measuredRows = 0;

  for (const line of source.split(/\r\n|\r|\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    measuredRows += 1;
    if (isTableSeparatorLine(trimmed)) {
      continue;
    }

    const cells = trimmed
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());
    const longestCellLength = Math.max(0, ...cells.map((cell) => cell.length));
    const wrappedLines = Math.max(
      1,
      Math.ceil(longestCellLength / RICH_TABLE_WRAP_COLUMN_ESTIMATE_CHARS),
    );

    height +=
      RICH_TABLE_ROW_HEIGHT_ESTIMATE_PX +
      (wrappedLines - 1) * RICH_TABLE_WRAPPED_ROW_EXTRA_HEIGHT_PX;
  }

  return Math.max(
    RICH_TABLE_ROW_HEIGHT_ESTIMATE_PX,
    height || measuredRows * RICH_TABLE_ROW_HEIGHT_ESTIMATE_PX,
  );
}
