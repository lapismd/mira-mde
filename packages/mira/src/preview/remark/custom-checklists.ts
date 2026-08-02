import { factorySpace } from "micromark-factory-space";
import { markdownLineEnding, markdownSpace } from "micromark-util-character";
import { codes } from "micromark-util-symbol";
import type { Code, Effects, State } from "micromark-util-types";
import type { ListItem, Paragraph, Root, Text } from "mdast";
import type { Plugin } from "unified";
import type { Node } from "unist";
import { visit } from "unist-util-visit";

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

function tokenizeTaskListCustomCheck(effects: Effects, ok: State, nok: State) {
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

function findTaskMarkerFromSource(
  source: string,
  node: ListItem,
): string | null {
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
    content.match(/^\s*(?:[-*+]|\d+[.)])\s+\[([^\]\r\n])\]\s/u)?.[1] ?? null
  );
}

function setTaskData(node: ListItem, value: string): void {
  node.data = {
    ...(node.data ?? {}),
    hProperties: {
      ...(node.data?.hProperties ?? {}),
      "data-task": value,
    },
  };
}
