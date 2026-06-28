import type { EditorState } from "@codemirror/state";
import type { RangeBoundary } from "./ranges";

export function getAtxHeadingMarkerRange(
  text: string,
  lineStart: number,
): RangeBoundary | null {
  const match = text.match(/^(#{1,6})(?=\s)/u);
  if (!match?.[1]) {
    return null;
  }

  return {
    from: lineStart,
    to: lineStart + match[1].length,
  };
}

export function selectionTouchesLine(
  state: EditorState,
  lineStart: number,
  lineEnd: number,
): boolean {
  return state.selection.ranges.some((selection) => {
    if (selection.empty) {
      return selection.from >= lineStart && selection.from <= lineEnd;
    }

    return selection.from <= lineEnd && selection.to >= lineStart;
  });
}
