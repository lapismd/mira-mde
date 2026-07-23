import type { EditorState } from "@codemirror/state";
import type { RangeBoundary } from "./ranges";

export function getAtxHeadingMarkerRange(
  text: string,
  lineStart: number,
): RangeBoundary | null {
  // Include the required whitespace after `#` markers so live preview does not
  // leave a visible indent once the hashes themselves are hidden.
  const match = text.match(/^(#{1,6})(?:[ \t]+)/u);
  if (!match?.[0]) {
    return null;
  }

  return {
    from: lineStart,
    to: lineStart + match[0].length,
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
