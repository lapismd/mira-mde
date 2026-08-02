import { EditorSelection } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import type { MiraMode } from "@lapismd/mira/extensions";

export type MiraModeSwitchPosition = {
  line: number | null;
  scrollTop: number;
  selection?: { anchor: number; head: number };
  target: "editor" | "preview";
  topDelta: number;
};

function visibleAnchor(
  nodes: readonly HTMLElement[],
  viewport: DOMRect,
): HTMLElement | null {
  let best: HTMLElement | null = null;
  let distance = Number.POSITIVE_INFINITY;
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (rect.bottom <= viewport.top + 1 || rect.top >= viewport.bottom) {
      continue;
    }
    const nextDistance = Math.abs(rect.top - viewport.top);
    if (nextDistance < distance) {
      best = node;
      distance = nextDistance;
    }
  }
  return best;
}

function previewLine(node: HTMLElement): number | null {
  const line = Number.parseInt(node.dataset["line"] ?? "", 10);
  return Number.isFinite(line) ? line : null;
}

export function capturePreviewPosition(
  scroller: HTMLElement,
): MiraModeSwitchPosition {
  const viewport = scroller.getBoundingClientRect();
  const anchor = visibleAnchor(
    Array.from(scroller.querySelectorAll<HTMLElement>("[data-line]")),
    viewport,
  );
  return {
    line: anchor ? previewLine(anchor) : null,
    scrollTop: scroller.scrollTop,
    target: "editor",
    topDelta: anchor ? anchor.getBoundingClientRect().top - viewport.top : 0,
  };
}

export function captureEditorPosition(
  view: EditorView,
): MiraModeSwitchPosition {
  const viewport = view.scrollDOM.getBoundingClientRect();
  const anchor = visibleAnchor(
    Array.from(
      view.dom.querySelectorAll<HTMLElement>(
        ".cm-lineNumbers .cm-gutterElement",
      ),
    ),
    viewport,
  );
  const fallbackLine = view.state.doc.lineAt(
    view.state.selection.main.head,
  ).number;
  const line = Number.parseInt(anchor?.textContent ?? "", 10);
  const selection = view.state.selection.main;
  return {
    line: Number.isFinite(line) ? line : fallbackLine,
    scrollTop: view.scrollDOM.scrollTop,
    selection: {
      anchor: selection.anchor,
      head: selection.head,
    },
    target: "preview",
    topDelta: anchor ? anchor.getBoundingClientRect().top - viewport.top : 0,
  };
}

export function restorePreviewPosition(
  scroller: HTMLElement,
  position: MiraModeSwitchPosition,
): void {
  const nodes = Array.from(
    scroller.querySelectorAll<HTMLElement>("[data-line]"),
  );
  const anchor =
    nodes.find((node) => {
      const line = previewLine(node);
      return line !== null && line >= (position.line ?? 1);
    }) ??
    [...nodes].reverse().find((node) => previewLine(node) !== null) ??
    null;
  if (!anchor) {
    scroller.scrollTo({ top: Math.max(0, position.scrollTop) });
    return;
  }
  const viewport = scroller.getBoundingClientRect();
  const rect = anchor.getBoundingClientRect();
  const anchorTop = scroller.scrollTop + rect.top - viewport.top;
  scroller.scrollTo({ top: Math.max(0, anchorTop - position.topDelta) });
}

export function restoreEditorPosition(
  view: EditorView,
  position: MiraModeSwitchPosition,
): void {
  const lineNumber = Math.min(
    Math.max(position.line ?? 1, 1),
    Math.max(view.state.doc.lines, 1),
  );
  const line = view.state.doc.line(lineNumber);
  if (position.selection) {
    view.dispatch({
      selection: EditorSelection.single(
        Math.min(position.selection.anchor, view.state.doc.length),
        Math.min(position.selection.head, view.state.doc.length),
      ),
    });
  }
  const block = view.lineBlockAt(line.from);
  view.scrollDOM.scrollTo({
    top: Math.max(0, block.top - position.topDelta),
  });
}

export function captureModeSwitchPosition(
  previous: MiraMode,
  next: MiraMode,
  view: EditorView | null,
  previewScroller: HTMLElement | null,
): MiraModeSwitchPosition | null {
  if (previous === next) {
    return null;
  }
  if (previous === "preview" && next !== "preview") {
    return previewScroller ? capturePreviewPosition(previewScroller) : null;
  }
  if (next === "preview" && previous !== "preview") {
    return view ? captureEditorPosition(view) : null;
  }
  if (next === "split" && previous !== "split") {
    return previous === "preview"
      ? previewScroller
        ? capturePreviewPosition(previewScroller)
        : null
      : view
        ? captureEditorPosition(view)
        : null;
  }
  return null;
}
