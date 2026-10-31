import type { Range } from "@codemirror/state";
import { Decoration } from "@codemirror/view";
import { NodeProp, type SyntaxNode, type Tree } from "@lezer/common";
import { highlightTree } from "@lezer/highlight";
import { miraClassHighlighter } from "../base/class-highlighter";

const marks = new Map<string, Decoration>();

function insideDirective(node: SyntaxNode): boolean {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.name === "ContainerDirective") return true;
  }
  return false;
}

function overlayPosition(
  overlay: readonly { from: number; to: number }[],
  offset: number,
): number | undefined {
  for (let index = 0; index < overlay.length; index++) {
    const range = overlay[index]!;
    const length = range.to - range.from;
    if (offset < length || (index === overlay.length - 1 && offset === length))
      return range.from + offset;
    offset -= length;
  }
  return undefined;
}

/** Preserve the mounted language colors when a Markdown fence is in a directive. */
export function directiveCodeHighlights(tree: Tree): Range<Decoration>[] {
  const ranges: Range<Decoration>[] = [];
  tree.iterate({
    enter(ref) {
      if (ref.name !== "FencedCode" || !insideDirective(ref.node)) return;
      const mounted = ref.node.tree?.prop(NodeProp.mounted);
      if (!mounted?.overlay?.length) return;
      for (const mark of ref.node.getChildren("CodeMark"))
        ranges.push(
          Decoration.mark({ class: "cm-meta" }).range(mark.from, mark.to),
        );
      const info = ref.node.getChild("CodeInfo");
      if (info)
        ranges.push(
          Decoration.mark({ class: "cm-label" }).range(info.from, info.to),
        );
      highlightTree(mounted.tree, miraClassHighlighter, (from, to, classes) => {
        const start = overlayPosition(mounted.overlay!, from);
        const end = overlayPosition(mounted.overlay!, to);
        if (
          !classes ||
          start === undefined ||
          end === undefined ||
          start >= end
        )
          return;
        let mark = marks.get(classes);
        if (!mark) {
          mark = Decoration.mark({ class: classes });
          marks.set(classes, mark);
        }
        ranges.push(mark.range(ref.from + start, ref.from + end));
      });
    },
  });
  return ranges;
}
