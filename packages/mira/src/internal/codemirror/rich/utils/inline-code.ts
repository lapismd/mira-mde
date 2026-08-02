import type { RangeBoundary } from "./ranges";

export function findInlineCodeRanges(text: string): RangeBoundary[] {
  const ranges: RangeBoundary[] = [];
  let index = 0;

  while (index < text.length) {
    if (text[index] !== "`" || isEscaped(text, index)) {
      index += 1;
      continue;
    }

    const tickCount = countRun(text, index, "`");
    const closingIndex = text.indexOf("`".repeat(tickCount), index + tickCount);
    if (closingIndex === -1) {
      break;
    }

    ranges.push({
      from: index,
      to: closingIndex + tickCount,
    });
    index = closingIndex + tickCount;
  }

  return ranges;
}

export function countRun(
  text: string,
  start: number,
  character: string,
): number {
  let count = 0;
  while (text[start + count] === character) {
    count += 1;
  }
  return count;
}

export function isPositionInsideRanges(
  position: number,
  ranges: RangeBoundary[],
): boolean {
  return ranges.some((range) => position >= range.from && position < range.to);
}

export function isEscaped(text: string, index: number): boolean {
  let backslashes = 0;
  let cursor = index - 1;
  while (cursor >= 0 && text[cursor] === "\\") {
    backslashes += 1;
    cursor -= 1;
  }
  return backslashes % 2 === 1;
}

export function isWhitespace(character: string): boolean {
  return character.length > 0 && /\s/u.test(character);
}
