import { tags as highlightTags } from "@lezer/highlight";
import {
  BlockContext,
  type Element,
  type InlineContext,
  type LeafBlock,
  type LeafBlockParser,
  type Line,
  type MarkdownConfig,
} from "@lezer/markdown";

function createAttributeElements(
  context: InlineContext | BlockContext,
  text: string,
  start: number,
): Element[] {
  if (!text) {
    return [];
  }

  const elements: Element[] = [];
  const attribute = /([A-Za-z_][\w-]*)(?:=(?:"([^"]*)"|'([^']*)'|([^\s]+)))?/g;
  let match: RegExpExecArray | null;

  while ((match = attribute.exec(text)) !== null) {
    const key = match[1] ?? "";
    const value = match[2] ?? match[3] ?? match[4];
    const nameStart = start + match.index;
    elements.push(
      context.elt("DirectiveAttrName", nameStart, nameStart + key.length),
    );

    if (value !== undefined) {
      const rawValue = match[0].slice(key.length + 1);
      const valueStart = nameStart + key.length + 1;
      elements.push(
        context.elt(
          "DirectiveAttrValue",
          valueStart,
          valueStart + rawValue.length,
        ),
      );
    }
  }

  return elements;
}

function parseDirectiveMetadata(
  context: InlineContext | BlockContext,
  source: string,
  start: number,
  markerLength: number,
  name: string,
  argsText: string | undefined,
  attrsText: string | undefined,
): Element[] {
  const children: Element[] = [
    context.elt("DirectiveMark", start, start + markerLength),
  ];
  const nameOffset = source.indexOf(name, markerLength);
  const nameStart = start + Math.max(markerLength, nameOffset);
  children.push(
    context.elt("DirectiveName", nameStart, nameStart + name.length),
  );

  if (argsText !== undefined) {
    const bracketStart = source.indexOf("[", nameOffset + name.length);
    const bracketEnd = source.indexOf("]", bracketStart + 1);
    if (bracketStart !== -1 && bracketEnd !== -1) {
      const rawArgs = source.slice(bracketStart + 1, bracketEnd);
      const leadingWhitespace = rawArgs.length - rawArgs.trimStart().length;
      const contentStart = start + bracketStart + 1 + leadingWhitespace;
      const contentEnd = contentStart + argsText.trim().length;
      const argsChildren: Element[] = [
        context.elt(
          "DirectiveDelimiter",
          start + bracketStart,
          start + bracketStart + 1,
        ),
        context.elt(
          "DirectiveDelimiter",
          start + bracketEnd,
          start + bracketEnd + 1,
        ),
      ];
      if (argsText.trim() && "parser" in context) {
        argsChildren.push(
          ...context.parser.parseInline(argsText.trim(), contentStart),
        );
      }
      children.push(
        context.elt("DirectiveArgs", contentStart, contentEnd, argsChildren),
      );
    }
  }

  if (attrsText !== undefined) {
    const braceStart = source.indexOf("{", nameOffset + name.length);
    if (braceStart !== -1) {
      const rawAttrs = source.slice(
        braceStart + 1,
        source.indexOf("}", braceStart),
      );
      const leadingWhitespace = rawAttrs.length - rawAttrs.trimStart().length;
      children.push(
        ...createAttributeElements(
          context,
          attrsText.trim(),
          start + braceStart + 1 + leadingWhitespace,
        ),
      );
    }
  }

  return children;
}

class LeafDirectiveParser implements LeafBlockParser {
  nextLine(): boolean {
    return false;
  }

  finish(context: BlockContext, leaf: LeafBlock): boolean {
    const match =
      /^\s*::([A-Za-z0-9_-]+)(?:\[\s*([^\]]*)\s*\])?(?:\{\s*([^}]*)\s*\})?/.exec(
        leaf.content,
      );
    if (!match) {
      return false;
    }

    const [source, name = "", argsText, attrsText] = match;
    const leadingWhitespace = source.length - source.trimStart().length;
    const start = leaf.start + leadingWhitespace;
    const trimmedSource = source.trimStart();
    context.addLeafElement(
      leaf,
      context.elt(
        "LeafDirective",
        leaf.start,
        leaf.start + leaf.content.length,
        parseDirectiveMetadata(
          context,
          trimmedSource,
          start,
          2,
          name,
          argsText,
          attrsText,
        ),
      ),
    );
    return true;
  }
}

function parseInlineDirective(
  context: InlineContext,
  next: number,
  position: number,
): number {
  if (next !== 58 /* : */) {
    return -1;
  }

  const match =
    /^:([A-Za-z0-9_-]+)(?:\[\s*([^\]]*)\s*\])?(?:\{\s*([^}]*)\s*\})?/.exec(
      context.slice(position, context.end),
    );
  if (!match) {
    return -1;
  }

  const [source, name = "", argsText, attrsText] = match;
  return context.addElement(
    context.elt(
      "InlineDirective",
      position,
      position + source.length,
      parseDirectiveMetadata(
        context,
        source,
        position,
        1,
        name,
        argsText,
        attrsText,
      ),
    ),
  );
}

function parseContainerDirective(context: BlockContext, line: Line) {
  const match =
    /^(:{3,})\s*([A-Za-z0-9_-]+)(?:\[\s*([^\]]*)\s*\])?(?:\{\s*([^}]*)\s*\})?/.exec(
      line.text,
    );
  if (!match) {
    return false;
  }

  const [source, marker = ":::", name = "", argsText, attrsText] = match;
  const start = context.lineStart + line.pos;
  context.startComposite("ContainerDirective", line.pos, marker.length);
  context.addElement(
    context.elt(
      "ContainerDirective",
      start,
      start + line.text.length,
      parseDirectiveMetadata(
        context,
        source,
        start,
        marker.length,
        name,
        argsText,
        attrsText,
      ),
    ),
  );
  context.nextLine();
  return null;
}

export const GenericDirectives: MarkdownConfig = {
  defineNodes: [
    { name: "InlineDirective" },
    { name: "LeafDirective", block: true },
    {
      name: "ContainerDirective",
      block: true,
      composite(context: BlockContext, line: Line, markerLength: number) {
        const match = /^(:{3,})\s*$/.exec(line.text);
        if (!match || (match[1]?.length ?? 0) < markerLength) {
          return true;
        }

        const markerStart =
          context.lineStart + line.pos + match[0].indexOf(":");
        const stack = (
          context as BlockContext & { stack: Array<{ end: number }> }
        ).stack;
        const block = stack[(line as Line & { depth: number }).depth];
        if (block) {
          block.end = context.lineStart + line.text.length;
        }
        context.addElement(
          context.elt(
            "DirectiveMark",
            markerStart,
            markerStart + (match[1]?.length ?? markerLength),
          ),
        );
        return false;
      },
    },
    { name: "DirectiveMark", style: highlightTags.processingInstruction },
    { name: "DirectiveName", style: highlightTags.variableName },
    { name: "DirectiveArgs", style: highlightTags.content },
    { name: "DirectiveAttrName", style: highlightTags.attributeName },
    {
      name: "DirectiveAttrDelimiter",
      style: highlightTags.processingInstruction,
    },
    { name: "DirectiveDelimiter", style: highlightTags.processingInstruction },
    { name: "DirectiveAttrValue", style: highlightTags.attributeValue },
  ],
  parseBlock: [
    {
      name: "ContainerDirective",
      parse: parseContainerDirective,
      before: "SetextHeading",
    },
    {
      name: "LeafDirective",
      leaf(_, leaf) {
        return /^\s*::\s*([A-Za-z0-9_-]+)?\s*(?:\[\s*([^\]]*)\s*\])?\s*(?:\{\s*([^}]*)\s*\})?/.test(
          leaf.content,
        )
          ? new LeafDirectiveParser()
          : null;
      },
      before: "SetextHeading",
    },
  ],
  parseInline: [
    {
      name: "InlineDirective",
      parse: parseInlineDirective,
      before: "Link",
    },
  ],
};
