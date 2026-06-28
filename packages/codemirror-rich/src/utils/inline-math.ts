import type { RangeBoundary } from "./ranges";
import { findInlineCodeRanges, isEscaped, isPositionInsideRanges, isWhitespace } from "./inline-code";

export type InlineMathRange = RangeBoundary & {
  source: string;
};

export function findInlineMathRanges(text: string): InlineMathRange[] {
  const ranges: InlineMathRange[] = [];
  const codeRanges = findInlineCodeRanges(text);
  let index = 0;

  while (index < text.length) {
    if (
      text[index] !== "$" ||
      text[index - 1] === "$" ||
      text[index + 1] === "$" ||
      isEscaped(text, index) ||
      isPositionInsideRanges(index, codeRanges) ||
      isWhitespace(text[index + 1] ?? "")
    ) {
      index += 1;
      continue;
    }

    let end = index + 1;
    let found = false;
    while (end < text.length) {
      if (
        text[end] === "$" &&
        text[end - 1] !== "$" &&
        text[end + 1] !== "$" &&
        !isEscaped(text, end) &&
        !isPositionInsideRanges(end, codeRanges) &&
        !isWhitespace(text[end - 1] ?? "") &&
        !/\d/u.test(text[end + 1] ?? "")
      ) {
        const source = text.slice(index, end + 1);
        if (source.slice(1, -1).trim()) {
          ranges.push({
            from: index,
            to: end + 1,
            source,
          });
        }
        index = end + 1;
        found = true;
        break;
      }

      end += 1;
    }

    if (!found) {
      index += 1;
    }
  }

  return ranges;
}
