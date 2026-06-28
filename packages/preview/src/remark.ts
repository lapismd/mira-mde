import { markdownLineEnding, markdownSpace } from "micromark-util-character";
import { factorySpace } from "micromark-factory-space";
import { codes } from "micromark-util-symbol";
import type { Code, Effects, State } from "micromark-util-types";
import type { Blockquote, ListItem, Paragraph, Root, Text } from "mdast";
import type { Plugin } from "unified";
import type { Node } from "unist";
import { visit } from "unist-util-visit";

type ParentNode = {
  children?: unknown[];
};

type MarkdownInlineNode = Text & {
  data?: Record<string, unknown>;
};

declare module "micromark-util-types" {
  interface TokenTypeMap {
    taskListCustomCheck: "taskListCustomCheck";
    taskListCustomCheckMarker: "taskListCustomCheckMarker";
    taskListCustomCheckValueChecked: "taskListCustomCheckValueChecked";
  }
}

type ExtendedListItem = ListItem & {
  value?: string;
};

type CheckList = Node & {
  type: "checkList";
  value: string;
};

declare module "mdast" {
  interface RootContentMap {
    checkList: CheckList;
  }

  interface PhrasingContentMap {
    checkList: CheckList;
  }
}

export const remarkWikiLinks: Plugin<[], Root> = () => {
  return (tree) =>
    splitTextNodes(tree, /(!?)\[\[([^\]\n]+)]]/g, (match) => {
      const isEmbed = match[1] === "!";
      const [target = "", alias] = (match[2] ?? "").split("|", 2);
      const label = alias || target;

      return {
        type: isEmbed ? "embed" : "wikilink",
        value: target,
        data: {
          hName: isEmbed ? "embed" : "wikilink",
          hProperties: {
            href: target,
            label,
          },
          hChildren: [{ type: "text", value: label }],
        },
      } as unknown as MarkdownInlineNode;
    });
};

export const remarkTags: Plugin<[], Root> = () => {
  return (tree) =>
    splitTextNodes(tree, /(^|[\s([{])#([\p{L}\p{N}_/-]+)/gu, (match) => {
      const prefix = match[1] ?? "";
      const value = `#${match[2]}`;
      const tag = {
        type: "tag",
        value,
        data: {
          hName: "tag",
          hProperties: { value },
          hChildren: [{ type: "text", value }],
        },
      } as unknown as MarkdownInlineNode;

      return prefix
        ? ([
            { type: "text", value: prefix } as Text,
            tag,
          ] as unknown as MarkdownInlineNode)
        : tag;
    });
};

export const remarkCallouts: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      const first = node.children[0] as Paragraph | undefined;
      const firstText = first?.children?.[0] as Text | undefined;
      if (!first || first.type !== "paragraph" || firstText?.type !== "text") {
        return;
      }

      const [firstLine = "", ...remainingLines] =
        firstText.value.split(/\r?\n/);
      const match = firstLine.match(/^\[!([\w-]+)]([+-]?)[ \t]*(.*)$/);
      if (!match) {
        return;
      }

      const calloutType = (match[1] ?? "note").toLowerCase();
      const collapsible = match[2] ?? "";
      const calloutTitle = match[3]?.trim() || defaultCalloutTitle(calloutType);
      const markerOffset =
        typeof firstText.position?.start.offset === "number"
          ? firstText.position.start.offset +
            firstLine.indexOf(collapsible || "]") +
            (collapsible ? 0 : 1)
          : -1;
      const remainingText = remainingLines.join("\n");

      if (remainingText.trim()) {
        firstText.value = remainingText;
      } else {
        first.children = first.children.filter((child) => child !== firstText);
      }

      if (!first.children.length) {
        node.children = node.children.filter((child) => child !== first);
      }

      node.data = {
        ...(node.data ?? {}),
        hName: "callout",
        hProperties: {
          "data-callout": calloutType,
          "data-expand-offset": markerOffset,
          "data-expandable": (collapsible.length > 0).toString(),
          "data-expanded": (collapsible === "+").toString(),
          "data-icon": calloutIcons[calloutType] ?? "info",
          "data-type": calloutType,
          title: calloutTitle,
          type: calloutType,
        },
      };
    });
  };
};

export const remarkCustomChecklists: Plugin<[], Root> = function () {
  const data = this.data();
  addParserExtension(data, "micromarkExtensions", gfmTaskListItem());
  addParserExtension(
    data,
    "fromMarkdownExtensions",
    gfmCustomChecklistFromMarkdown(),
  );

  return (tree, file) => {
    const source = String(file.value ?? "");
    visit(tree, "listItem", (node: ListItem) => {
      const paragraph = node.children[0] as Paragraph | undefined;
      const first = paragraph?.children?.[0] as Text | undefined;
      if (
        !paragraph ||
        paragraph.type !== "paragraph" ||
        first?.type !== "text"
      ) {
        return;
      }

      const match = first.value.match(/^\[([^\]\r\n])\]\s+/u);
      if (!match) {
        syncExistingTaskData(node, source);
        return;
      }

      const task = match[1] ?? " ";
      first.value = first.value.slice(match[0].length);
      node.checked = task.trim().length > 0;
      setTaskData(node, task);

      if (!first.value) {
        paragraph.children.shift();
      }
    });
  };
};

function addParserExtension(
  data: Record<string, unknown> | any,
  field: string,
  value: unknown,
): void {
  const list = Array.isArray(data[field])
    ? (data[field] as unknown[])
    : ((data[field] = []) as unknown[]);
  list.push(value);
}

const taskListCustomCheckTypes = {
  taskListCustomCheck: "taskListCustomCheck",
  taskListCustomCheckMarker: "taskListCustomCheckMarker",
  taskListCustomCheckValueChecked: "taskListCustomCheckValueChecked",
} as const;

function isCheckboxChar(code: Code): boolean {
  if (code === null) {
    return false;
  }
  return (
    (code >= codes.digit0 && code <= codes.digit9) ||
    (code >= codes.uppercaseA && code <= codes.uppercaseZ) ||
    (code >= codes.lowercaseA && code <= codes.lowercaseZ) ||
    code === codes.dash ||
    code === codes.underscore ||
    code === codes.dot ||
    code === codes.tilde ||
    code === codes.exclamationMark ||
    code === codes.dollarSign ||
    code === codes.ampersand ||
    code === codes.apostrophe ||
    code === codes.leftParenthesis ||
    code === codes.rightParenthesis ||
    code === codes.asterisk ||
    code === codes.plusSign ||
    code === codes.comma ||
    code === codes.semicolon ||
    code === codes.atSign ||
    code === codes.leftCurlyBrace ||
    code === codes.rightCurlyBrace ||
    code === codes.slash ||
    code === codes.numberSign ||
    code === codes.backslash ||
    code === codes.quotationMark ||
    code === codes.greaterThan ||
    code === codes.lessThan ||
    code === codes.equalsTo ||
    code === codes.questionMark
  );
}

function gfmTaskListItem() {
  return {
    text: { [codes.leftSquareBracket]: taskListCustomCheck },
  };
}

const taskListCustomCheck = {
  name: "taskListCustomCheck",
  tokenize: tokenizeTaskListCustomCheck,
};

function gfmCustomChecklistFromMarkdown(): any {
  return {
    enter: {
      taskListCustomCheck(this: any, token: any) {
        this.enter({ type: "checkList", value: "" }, token);
      },
      taskListCustomCheckValueChecked(this: any, token: any) {
        const node = this.stack[this.stack.length - 1];
        if (node.type === "checkList") {
          (node as CheckList).value = this.sliceSerialize(token);
        }
      },
    },
    exit: {
      taskListCustomCheck(this: any, token: any) {
        const node = this.stack[this.stack.length - 1] as CheckList;
        if (node.type === "checkList") {
          const paragraph = this.stack[this.stack.length - 2];
          const parent = this.stack[this.stack.length - 3] as ExtendedListItem;
          if (
            parent.type === "listItem" &&
            paragraph.type === "paragraph" &&
            paragraph.children[0] === node
          ) {
            paragraph.children.shift();
            parent.checked = node.value.trim().length > 0;
            parent.value = node.value;
            setTaskData(parent, node.value);
          }
        }
        this.exit(token);
      },
    },
  };
}

function tokenizeTaskListCustomCheck(
  effects: Effects,
  ok: State,
  nok: State,
) {
  return open;

  function open(code: Code) {
    if (code !== codes.leftSquareBracket) {
      return nok(code);
    }

    effects.enter(taskListCustomCheckTypes.taskListCustomCheck);
    effects.enter(taskListCustomCheckTypes.taskListCustomCheckMarker);
    effects.consume(code);
    effects.exit(taskListCustomCheckTypes.taskListCustomCheckMarker);
    return inside;
  }

  function inside(code: Code) {
    if (isCheckboxChar(code)) {
      effects.enter(taskListCustomCheckTypes.taskListCustomCheckValueChecked);
      effects.consume(code);
      effects.exit(taskListCustomCheckTypes.taskListCustomCheckValueChecked);
      return close;
    }
    return nok(code);
  }

  function close(code: Code) {
    if (code === codes.rightSquareBracket) {
      effects.enter(taskListCustomCheckTypes.taskListCustomCheckMarker);
      effects.consume(code);
      effects.exit(taskListCustomCheckTypes.taskListCustomCheckMarker);
      effects.exit(taskListCustomCheckTypes.taskListCustomCheck);
      return after;
    }
    return nok(code);
  }

  function after(code: Code) {
    if (markdownLineEnding(code)) {
      return ok(code);
    }
    if (markdownSpace(code)) {
      return effects.check({ tokenize: spaceThenNonSpace }, ok, nok)(code);
    }
    return nok(code);
  }

  function spaceThenNonSpace(effects: Effects, ok: State, nok: State) {
    return factorySpace(effects, afterSpace, "whitespace");

    function afterSpace(code: Code) {
      return code === null || markdownLineEnding(code) ? nok(code) : ok(code);
    }
  }
}

function syncExistingTaskData(node: ListItem, source: string): void {
  const existing =
    (node.data?.hProperties?.["data-task"] as string | undefined) ??
    ((node.data as Record<string, unknown> | undefined)?.value as
      | string
      | undefined) ??
    (node as ExtendedListItem).value;
  if (existing && existing !== "x") {
    setTaskData(node, existing);
    return;
  }

  const marker = findTaskMarkerFromSource(source, node);
  if (marker) {
    setTaskData(node, marker);
    return;
  }

  if (typeof node.checked !== "boolean") {
    return;
  }

  setTaskData(node, node.checked ? "x" : " ");
}

function findTaskMarkerFromSource(source: string, node: ListItem): string | null {
  const from = node.position?.start.offset;
  const to = node.position?.end.offset;
  if (typeof from !== "number" || typeof to !== "number") {
    return null;
  }
  const lineStart = source.lastIndexOf("\n", Math.max(0, from - 1)) + 1;
  const lineEnd = source.indexOf("\n", from);
  const content = source.slice(
    lineStart,
    lineEnd === -1 ? Math.max(to, lineStart) : Math.max(lineEnd, to),
  );
  return (
    content.match(/^\s*(?:[-*+]|\d+[.)])\s+\[([^\]\r\n])\]\s/u)?.[1] ??
    null
  );
}

function setTaskData(node: ListItem, value: string): void {
  const task = value.toLowerCase();
  node.data = {
    ...(node.data ?? {}),
    hProperties: {
      ...(node.data?.hProperties ?? {}),
      "data-task": task,
    },
  };
}

const calloutIcons: Record<string, string> = {
  abstract: "clipboard-list",
  attention: "triangle-alert",
  bug: "bug",
  caution: "triangle-alert",
  check: "check",
  cite: "bookmark",
  danger: "zap",
  done: "check",
  error: "zap",
  example: "list",
  fail: "x",
  failure: "x",
  faq: "circle-help",
  help: "circle-help",
  hint: "flame",
  important: "flame",
  info: "info",
  missing: "x",
  note: "pencil",
  question: "circle-help",
  quote: "quote",
  success: "check",
  summary: "clipboard-list",
  tip: "flame",
  tldr: "clipboard-list",
  todo: "circle-check",
  warning: "triangle-alert",
};

function defaultCalloutTitle(type: string): string {
  return `${type.slice(0, 1).toUpperCase()}${type.slice(1)}`;
}

export const remarkDirectivesToHast: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, (node: any) => {
      if (
        node.type !== "containerDirective" &&
        node.type !== "leafDirective" &&
        node.type !== "textDirective"
      ) {
        return;
      }

      node.data = {
        ...(node.data ?? {}),
        hName: "directive",
        hProperties: {
          ...(node.attributes ?? {}),
          "data-directive": node.name,
        },
      };
    });
  };
};

export const remarkFrontmatterToHast: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, (node: any) => {
      if (node.type !== "yaml" && node.type !== "toml") {
        return;
      }

      const frontmatterType = node.type;
      node.type = "frontmatter";
      node.data = {
        ...(node.data ?? {}),
        hName: "frontmatter",
        hProperties: {
          ...(node.data?.hProperties ?? {}),
          frontmatter: node.value ?? "",
          value: node.value ?? "",
          "data-frontmatter": frontmatterType,
        },
        hChildren: [],
      };
    });
  };
};

export const remarkPositionsToData: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, (node: any) => {
      if (!node.position) {
        return;
      }
      node.data = {
        ...(node.data ?? {}),
        hProperties: {
          ...(node.data?.hProperties ?? {}),
          "data-line": node.position.start.line,
          "data-offset": node.position.start.offset,
          "data-offset-end": node.position.end.offset,
        },
      };
    });
  };
};

function splitTextNodes(
  tree: Root,
  regexp: RegExp,
  createNode: (
    match: RegExpMatchArray,
  ) => MarkdownInlineNode | MarkdownInlineNode[],
): void {
  visit(tree, "text", (node: Text, index, parent: ParentNode | undefined) => {
    if (index === undefined || !parent?.children) {
      return;
    }

    const replacements: unknown[] = [];
    let lastIndex = 0;
    for (const match of node.value.matchAll(regexp)) {
      const matchIndex = match.index ?? 0;
      if (matchIndex > lastIndex) {
        replacements.push({
          type: "text",
          value: node.value.slice(lastIndex, matchIndex),
        });
      }

      replacements.push(...[createNode(match)].flat());
      lastIndex = matchIndex + match[0].length;
    }

    if (!replacements.length) {
      return;
    }

    if (lastIndex < node.value.length) {
      replacements.push({
        type: "text",
        value: node.value.slice(lastIndex),
      });
    }

    parent.children.splice(index, 1, ...replacements);
  });
}
