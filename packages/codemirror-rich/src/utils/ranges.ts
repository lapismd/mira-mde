import type { EditorState, Range } from "@codemirror/state";
import type { Decoration } from "@codemirror/view";

export type RangeBoundary = {
  from: number;
  to: number;
};

export function rangeIntersectsSelection(
  state: EditorState,
  from: number,
  to: number,
): boolean {
  return state.selection.ranges.some(
    (selection) => selection.from <= to && selection.to >= from,
  );
}

export function rangeContainsSelectionCursor(
  state: EditorState,
  from: number,
  to: number,
): boolean {
  return state.selection.ranges.some((selection) => {
    if (selection.empty) {
      return selection.from > from && selection.from < to;
    }
    return selection.from < to && selection.to > from;
  });
}

export function hasInitialFrontmatterCursor(
  state: EditorState,
  from: number,
): boolean {
  return (
    from === 0 &&
    state.selection.ranges.length === 1 &&
    state.selection.main.empty &&
    state.selection.main.from === 0
  );
}

export function hasRenderedInitialFrontmatterCursor(
  state: EditorState,
): boolean {
  if (!hasInitialFrontmatterCursor(state, 0) || state.doc.lines < 3) {
    return false;
  }

  if (state.doc.line(1).text !== "---") {
    return false;
  }

  for (let lineNumber = 2; lineNumber <= state.doc.lines; lineNumber += 1) {
    if (state.doc.line(lineNumber).text === "---") {
      return true;
    }
  }

  return false;
}

export function rangesOverlap(left: RangeBoundary, right: RangeBoundary): boolean {
  return left.from < right.to && right.from < left.to;
}

export function sortRanges(ranges: Range<Decoration>[]): Range<Decoration>[] {
  return ranges.sort((left, right) => {
    if (left.from !== right.from) {
      return left.from - right.from;
    }
    return left.to - right.to;
  });
}
