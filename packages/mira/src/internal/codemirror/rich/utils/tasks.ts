import type { EditorState } from "@codemirror/state";

export type TaskMarkerRange = {
  markerStart: number;
  checkboxStart: number;
  checkboxEnd: number;
  markerEnd: number;
  taskValue: string;
};

export function getTaskMarkerRange(
  text: string,
  lineStart: number,
): TaskMarkerRange | null {
  const match = text.match(
    /^([ \t]*(?:>[ \t]*)*)((?:[-*+]|\d+[.)])[ \t]+)\[([^\]\r\n])\][ \t]/u,
  );
  if (!match || match[1] === undefined || match[2] === undefined) {
    return null;
  }

  const markerStart = lineStart + match[1].length;
  const checkboxStart = markerStart + match[2].length;
  return {
    markerStart,
    checkboxStart,
    checkboxEnd: checkboxStart + 3,
    markerEnd: lineStart + match[0].length,
    taskValue: match[3] ?? " ",
  };
}

export function selectionTouchesTaskMarker(
  state: EditorState,
  lineStart: number,
  markerEnd: number,
): boolean {
  return state.selection.ranges.some((selection) => {
    if (selection.empty) {
      return selection.from >= lineStart && selection.from <= markerEnd;
    }

    return selection.from <= markerEnd && selection.to >= lineStart;
  });
}
