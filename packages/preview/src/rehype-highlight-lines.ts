import type { Element, ElementContent, Root, Text } from "hast";
import type { Plugin } from "unified";
import { visit, type VisitorResult } from "unist-util-visit";

type HighlightLinesOptions = {
  showLineNumbers?: boolean;
  keepOuterBlankLine?: boolean;
};

const lineBreaks = /\r?\n|\r/g;
const leadingLineBreaks = /^(\r?\n|\r)+/;

export const rehypeHighlightLines: Plugin<[HighlightLinesOptions?], Root> = (
  options = {},
) => {
  const showLineNumbers = options.showLineNumbers ?? false;
  const keepOuterBlankLine = options.keepOuterBlankLine ?? false;

  return (tree) => {
    visit(tree, "element", (code, index, parent): VisitorResult => {
      if (
        index === undefined ||
        !parent ||
        code.tagName !== "code" ||
        parent.type !== "element" ||
        parent.tagName !== "pre"
      ) {
        return;
      }

      if (
        !Array.isArray(code.properties.className) &&
        code.properties.className !== undefined
      ) {
        return;
      }

      const meta = String(
        code.data?.meta ?? code.properties.metastring ?? "",
      ).toLowerCase();
      const classNames = code.properties.className as string[] | undefined;
      const directives = classNames
        ?.map((className) => className.toLowerCase().replaceAll("-", ""))
        .filter((className) =>
          [
            "showlinenumbers",
            "numberlines",
            "linenumbers",
            "nolinenumbers",
            "keepouterblankline",
          ].includes(className),
        );

      const noLineNumbers =
        meta.includes("nolinenumbers") ||
        Boolean(directives?.includes("nolinenumbers"));
      const lineNumberStart = getLineNumberStart(
        meta,
        code.properties.dataStartNumbering,
      );
      const lineNumbering =
        !noLineNumbers &&
        (lineNumberStart ??
          (showLineNumbers ||
          ["showlinenumbers", "numberlines", "linenumbers"].some(
            (keyword) =>
              meta.includes(keyword) || directives?.includes(keyword),
          )
            ? true
            : false));
      const highlightedLines = [
        ...parseMetaHighlightedLines(meta),
        ...parseRange(String(code.properties.dataHighlightLines ?? "")),
      ];
      const keepOuterBlank =
        keepOuterBlankLine ||
        meta.includes("keepouterblankline") ||
        Boolean(directives?.includes("keepouterblankline"));

      code.properties.className = classNames?.filter(
        (className) =>
          ![
            "showlinenumbers",
            "numberlines",
            "linenumbers",
            "nolinenumbers",
            "keepouterblankline",
          ].includes(className.toLowerCase().replaceAll("-", "")),
      );

      if (!code.properties.className?.length) {
        code.properties.className = undefined;
      }
      code.properties.dataStartNumbering = undefined;
      code.properties.dataHighlightLines = undefined;
      code.properties.metastring = undefined;

      if (lineNumbering === false && highlightedLines.length === 0) {
        return;
      }

      wrapCodeLines(code, {
        highlightedLines,
        keepOuterBlank,
        lineNumbering,
      });
      code.properties["data-muted"] = String(meta.includes("muted"));
    });
  };
};

function getLineNumberStart(
  meta: string,
  propertyValue: unknown,
): number | undefined {
  const metaStart =
    /(showlinenumbers|numberlines|linenumbers)=(?<start>\d+)/u.exec(meta)
      ?.groups?.start;
  const propertyStart = String(propertyValue ?? "");
  const value = Number(metaStart ?? propertyStart);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function parseMetaHighlightedLines(meta: string): number[] {
  return parseRange(/\{(?<lines>[\d\s,-]+)\}/u.exec(meta)?.groups?.lines ?? "");
}

function parseRange(value: string): number[] {
  const result: number[] = [];

  for (const part of value.split(",").map((item) => item.trim())) {
    if (/^-?\d+$/u.test(part)) {
      result.push(Number.parseInt(part, 10));
      continue;
    }

    const match = /^(-?\d+)(-|\.\.\.?|\u2025|\u2026|\u22EF)(-?\d+)$/u.exec(
      part,
    );
    if (!match) {
      continue;
    }

    const start = Number.parseInt(match[1]!, 10);
    let end = Number.parseInt(match[3]!, 10);
    const increment = start < end ? 1 : -1;
    if (match[2] === "-" || match[2] === ".." || match[2] === "\u2025") {
      end += increment;
    }

    for (let index = start; index !== end; index += increment) {
      result.push(index);
    }
  }

  return result;
}

function wrapCodeLines(
  code: Element,
  options: {
    highlightedLines: number[];
    keepOuterBlank: boolean;
    lineNumbering: boolean | number;
  },
): void {
  flattenCodeTree(code);
  splitLeadingLineBreak(code);
  splitMultilineTextChildren(code);

  const replacement: ElementContent[] = [];
  let start = 0;
  let textRemainder = "";
  let lineNumber = 0;

  for (let index = 0; index < code.children.length; index += 1) {
    const child = code.children[index];
    if (child?.type !== "text") {
      continue;
    }

    let textStart = 0;
    const matches = Array.from(child.value.matchAll(lineBreaks));

    for (const [iteration, match] of matches.entries()) {
      const line = code.children.slice(start, index);
      if (textRemainder) {
        line.unshift({ type: "text", value: textRemainder });
        textRemainder = "";
      }
      if ((match.index ?? 0) > textStart) {
        line.push({
          type: "text",
          value: child.value.slice(textStart, match.index),
        });
      }

      const isFirst = index === 0 && iteration === 0;
      const isLast =
        index === code.children.length - 1 && iteration === matches.length - 1;

      if (
        !((isFirst || isLast) && !options.keepOuterBlank && line.length === 0)
      ) {
        replacement.push(createCodeLine(line, ++lineNumber, options), {
          type: "text",
          value: match[0],
        });
      }

      start = index + 1;
      textStart = (match.index ?? 0) + match[0].length;
    }

    if (start === index + 1) {
      textRemainder = child.value.slice(textStart);
    }
  }

  const remainingLine = code.children.slice(start);
  if (textRemainder) {
    remainingLine.unshift({ type: "text", value: textRemainder });
  }

  if (remainingLine.length > 0) {
    if (
      remainingLine[0]?.type === "text" &&
      remainingLine[0].value.trim() === ""
    ) {
      replacement.push(...remainingLine);
    } else {
      replacement.push(createCodeLine(remainingLine, ++lineNumber, options));
    }
  }

  code.children = replacement;
  code.properties.style = `--numbered-code-line-size: ${String(lineNumber + 1).length}`;
}

function createCodeLine(
  children: ElementContent[],
  lineNumber: number,
  options: {
    highlightedLines: number[];
    lineNumbering: boolean | number;
  },
): Element {
  return {
    type: "element",
    tagName: "span",
    children,
    properties: {
      className: [
        "code-line",
        options.lineNumbering || options.lineNumbering === 0
          ? "numbered-code-line"
          : "",
        options.highlightedLines.includes(lineNumber)
          ? "highlighted-code-line"
          : "",
      ].filter(Boolean),
      dataLineNumber:
        typeof options.lineNumbering === "number"
          ? options.lineNumbering - 1 + lineNumber
          : options.lineNumbering
            ? lineNumber
            : undefined,
    },
  };
}

function flattenCodeTree(code: Element): void {
  const next: ElementContent[] = [];

  for (const child of code.children) {
    if (child.type !== "element") {
      next.push(child);
      continue;
    }

    const className = child.properties.className;
    const classes = Array.isArray(className)
      ? className.map(String)
      : className
        ? [String(className)]
        : [];

    if (child.children.length === 1 && child.children[0]?.type !== "element") {
      next.push(child);
      continue;
    }

    const nested = child as Element;
    flattenCodeTree(nested);
    for (const nestedChild of nested.children) {
      if (nestedChild.type === "element") {
        nestedChild.properties.className = [
          ...classes,
          ...(Array.isArray(nestedChild.properties.className)
            ? nestedChild.properties.className.map(String)
            : []),
        ];
      }
      next.push(nestedChild);
    }
  }

  code.children = next;
}

function splitLeadingLineBreak(code: Element): void {
  const first = code.children[0];
  if (!isElementWithText(first)) {
    return;
  }

  const match = leadingLineBreaks.exec(first.children[0].value);
  if (!match) {
    return;
  }

  code.children.unshift({ type: "text", value: match[0] });
  first.children[0].value = first.children[0].value.slice(match[0].length);
}

function splitMultilineTextChildren(code: Element): void {
  for (let index = 0; index < code.children.length; index += 1) {
    const child = code.children[index];
    if (
      !isElementWithText(child) ||
      !lineBreaks.test(child.children[0].value)
    ) {
      continue;
    }

    const chunks = child.children[0].value.split(lineBreaks);
    const replacement: ElementContent[] = [];
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
      const nextChild: Element = {
        ...child,
        children: [{ type: "text", value: chunks[chunkIndex] ?? "" }],
      };
      replacement.push(nextChild);
      if (chunkIndex < chunks.length - 1) {
        replacement.push({ type: "text", value: "\n" });
      }
    }

    code.children.splice(index, 1, ...replacement);
  }
}

function isElementWithText(
  node: ElementContent | undefined,
): node is Element & { children: [Text] } {
  return (
    node?.type === "element" &&
    node.children.length === 1 &&
    node.children[0]?.type === "text"
  );
}
