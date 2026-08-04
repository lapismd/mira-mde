import type { BlockContext, Line, MarkdownConfig } from "@lezer/markdown";

type CompositeLine = Line & { depth: number };

function droppedBlockquoteContext(
  context: BlockContext,
  line: CompositeLine,
): boolean {
  const handledDepth = Math.min(line.depth, context.depth);
  for (let depth = handledDepth; depth < context.depth; depth += 1) {
    if (context.parentType(depth).name === "Blockquote") {
      return true;
    }
  }
  return false;
}

/**
 * Keep CodeMirror's syntax tree aligned with the reading renderer when an
 * unquoted list marker follows a lazily continued blockquote paragraph.
 *
 * Lezer otherwise keeps non-`1.` ordered markers inside the quote paragraph,
 * which makes a following four-space list continuation parse as indented code.
 */
export const ListAfterLazyBlockquote: MarkdownConfig = {
  parseBlock: [
    {
      name: "ListAfterLazyBlockquote",
      before: "OrderedList",
      endLeaf(context, line) {
        return (
          droppedBlockquoteContext(context, line as CompositeLine) &&
          /^(?:[-+*]|\d+[.)])\s+/u.test(line.text.slice(line.pos))
        );
      },
    },
  ],
};
