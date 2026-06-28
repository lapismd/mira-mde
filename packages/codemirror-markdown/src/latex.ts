import { StreamLanguage } from "@codemirror/language";
import { parseMixed, Parser, type SyntaxNodeRef } from "@lezer/common";
import { tags } from "@lezer/highlight";
import {
  type DelimiterType,
  InlineContext,
  type MarkdownConfig,
  type NodeSpec,
} from "@lezer/markdown";
import { stexMath } from "@codemirror/legacy-modes/mode/stex";

const INLINE_MATH_DOLLAR = "InlineMathDollar";
const INLINE_MATH_BRACKET = "InlineMathBracket";
const BLOCK_MATH_DOLLAR = "BlockMathDollar";
const BLOCK_MATH_BRACKET = "BlockMathBracket";

const delimiterLength: Record<string, number> = {
  [INLINE_MATH_DOLLAR]: 1,
  [INLINE_MATH_BRACKET]: 3,
  [BLOCK_MATH_DOLLAR]: 2,
  [BLOCK_MATH_BRACKET]: 3,
};

export const latexParser = StreamLanguage.define(stexMath).parser;

const delimiters = Object.keys(delimiterLength).reduce<
  Record<string, DelimiterType>
>((accumulator, name) => {
  accumulator[name] = { mark: `${name}Mark`, resolve: name };
  return accumulator;
}, {});

export function parseLatex(parser: Parser = latexParser): MarkdownConfig {
  const defineNodes: NodeSpec[] = [];
  Object.keys(delimiterLength).forEach((name) => {
    defineNodes.push(
      {
        name,
        style: tags.emphasis,
      },
      { name: `${name}Mark`, style: tags.processingInstruction },
    );
  });

  return {
    defineNodes,
    parseInline: [
      {
        name: BLOCK_MATH_DOLLAR,
        parse(context: InlineContext, next: number, position: number): number {
          if (next !== 36 || context.char(position + 1) !== 36) {
            return -1;
          }

          return addDelimiter(context, BLOCK_MATH_DOLLAR, position, true, true);
        },
      },
      {
        name: INLINE_MATH_DOLLAR,
        parse(context: InlineContext, next: number, position: number): number {
          if (next !== 36 || context.char(position + 1) === 36) {
            return -1;
          }

          return addDelimiter(
            context,
            INLINE_MATH_DOLLAR,
            position,
            true,
            true,
          );
        },
      },
      {
        before: "Escape",
        name: INLINE_MATH_BRACKET,
        parse(context: InlineContext, next: number, position: number): number {
          if (
            next !== 92 ||
            context.char(position + 1) !== 92 ||
            ![40, 41].includes(context.char(position + 2))
          ) {
            return -1;
          }

          return addDelimiter(
            context,
            INLINE_MATH_BRACKET,
            position,
            context.char(position + 2) === 40,
            context.char(position + 2) === 41,
          );
        },
      },
      {
        before: "Escape",
        name: BLOCK_MATH_BRACKET,
        parse(context: InlineContext, next: number, position: number): number {
          if (
            next !== 92 ||
            context.char(position + 1) !== 92 ||
            ![91, 93].includes(context.char(position + 2))
          ) {
            return -1;
          }

          return addDelimiter(
            context,
            BLOCK_MATH_BRACKET,
            position,
            context.char(position + 2) === 91,
            context.char(position + 2) === 93,
          );
        },
      },
    ],
    wrap: parser
      ? parseMixed((node: SyntaxNodeRef) => {
          const length = delimiterLength[node.type.name];
          if (!length) {
            return null;
          }

          return {
            overlay: [
              {
                from: node.from + length,
                to: node.to - length,
              },
            ],
            parser,
          };
        })
      : undefined,
  };
}

function addDelimiter(
  context: InlineContext,
  name: string,
  position: number,
  open: boolean,
  close: boolean,
): number {
  const length = delimiterLength[name];
  const delimiter = delimiters[name];
  if (!length || !delimiter) {
    return -1;
  }
  return context.addDelimiter(
    delimiter,
    position,
    position + length,
    open,
    close,
  );
}
