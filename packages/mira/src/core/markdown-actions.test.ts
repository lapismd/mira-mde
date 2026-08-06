import { EditorSelection } from "@codemirror/state";
import { redo, undo } from "@codemirror/commands";
import { describe, expect, it } from "vitest";
import { createBaseCodeMirrorExtensions } from "../internal/codemirror/base";
import { createMarkdownCodeMirrorExtensions } from "../internal/codemirror/markdown";
import { isMiraMarkdownActionActive, MiraEditorController } from ".";
import type { MiraMarkdownActionId } from "./markdown-actions";

function createController(
  value: string,
  options: {
    readonly?: boolean;
    onChange?: (value: string, event?: string) => void;
  } = {},
) {
  return new MiraEditorController({
    value,
    codeMirrorExtensions: [
      createBaseCodeMirrorExtensions({
        lineNumbers: false,
        readonly: options.readonly,
      }),
      createMarkdownCodeMirrorExtensions({ sourceMode: true }),
    ],
    onChange(next, change) {
      options.onChange?.(next, change.userEvent);
    },
  });
}

function select(
  controller: MiraEditorController,
  anchor: number,
  head = anchor,
) {
  controller.view.dispatch({
    selection: EditorSelection.single(anchor, head),
  });
}

function apply(
  value: string,
  action: MiraMarkdownActionId,
  anchor: number,
  head = anchor,
) {
  const controller = createController(value);
  select(controller, anchor, head);
  expect(controller.applyMarkdownAction(action)).toBe(true);
  return {
    controller,
    selection: controller.view.state.selection.main,
    value: controller.getValue(),
  };
}

describe("inline Markdown toolbar actions", () => {
  it("reports an exact formatted selection as active", () => {
    const controller = createController("A **bold** word");

    select(controller, 4, 8);
    expect(isMiraMarkdownActionActive(controller.view.state, "bold")).toBe(
      true,
    );
    expect(isMiraMarkdownActionActive(controller.view.state, "italic")).toBe(
      false,
    );

    select(controller, 5, 8);
    expect(isMiraMarkdownActionActive(controller.view.state, "bold")).toBe(
      false,
    );
  });

  it.each([
    ["bold", "word", "**word**"],
    ["italic", "word", "_word_"],
    ["strikethrough", "word", "~~word~~"],
    ["inlineCode", "word", "`word`"],
  ] as const)("wraps the current word for %s", (action, source, expected) => {
    const result = apply(source, action, 2);
    expect(result.value).toBe(expected);
    expect(result.selection.anchor).toBe(2 + expected.indexOf(source) - 0);
    expect(result.selection.empty).toBe(true);
  });

  it.each([
    ["bold", "**word**", 4],
    ["bold", "__word__", 4],
    ["italic", "_word_", 3],
    ["italic", "*word*", 3],
    ["strikethrough", "~~word~~", 4],
    ["inlineCode", "`word`", 3],
  ] as const)(
    "removes enclosing %s syntax at the caret",
    (action, source, caret) => {
      const result = apply(source, action, caret);
      expect(result.value).toBe("word");
      expect(result.selection.anchor).toBe(caret - (source.length - 4) / 2);
    },
  );

  it("wraps and unwraps an exact selection while preserving its direction", () => {
    const wrapped = apply("one two", "bold", 7, 4);
    expect(wrapped.value).toBe("one **two**");
    expect(wrapped.selection.anchor).toBe(9);
    expect(wrapped.selection.head).toBe(6);

    expect(wrapped.controller.applyMarkdownAction("bold")).toBe(true);
    expect(wrapped.controller.getValue()).toBe("one two");
    expect(wrapped.controller.view.state.selection.main.anchor).toBe(7);
    expect(wrapped.controller.view.state.selection.main.head).toBe(4);
  });

  it("inserts empty delimiter pairs on whitespace and places the caret inside", () => {
    const result = apply("one two", "bold", 3);
    expect(result.value).toBe("one**** two");
    expect(result.selection.anchor).toBe(5);
  });

  it("uses a longer inline-code fence when the selection contains backticks", () => {
    const result = apply("a`b", "inlineCode", 0, 3);
    expect(result.value).toBe("``a`b``");
  });

  it("preserves nested formatting when removing only the requested syntax", () => {
    const result = apply("**bold _and italic_**", "bold", 8);
    expect(result.value).toBe("bold _and italic_");
  });

  it("wraps a current word as a link, selects its target, and unlinks from the target", () => {
    const linked = apply("Visit Mira today", "link", 8);
    expect(linked.value).toBe("Visit [Mira](https://example.com) today");
    expect(
      linked.controller.view.state.sliceDoc(
        linked.selection.from,
        linked.selection.to,
      ),
    ).toBe("https://example.com");

    expect(linked.controller.applyMarkdownAction("link")).toBe(true);
    expect(linked.controller.getValue()).toBe("Visit Mira today");
  });

  it("creates one undoable transaction with the formatting user event", () => {
    const changes: Array<{ value: string; event?: string }> = [];
    const controller = createController("word", {
      onChange(value, event) {
        changes.push({ value, event });
      },
    });
    select(controller, 2);

    expect(controller.applyMarkdownAction("bold")).toBe(true);
    expect(changes).toEqual([{ value: "**word**", event: "input.format" }]);
    expect(undo(controller.view)).toBe(true);
    expect(controller.getValue()).toBe("word");
    expect(redo(controller.view)).toBe(true);
    expect(controller.getValue()).toBe("**word**");
  });

  it("preserves the editor scroll position while restoring focus", () => {
    const controller = createController("word");
    const host = document.createElement("div");
    document.body.append(host);
    controller.mount(host);
    select(controller, 2);
    controller.view.scrollDOM.scrollTop = 31;
    controller.view.scrollDOM.scrollLeft = 7;

    expect(controller.applyMarkdownAction("bold")).toBe(true);
    expect(controller.view.hasFocus).toBe(true);
    expect(controller.view.scrollDOM.scrollTop).toBe(31);
    expect(controller.view.scrollDOM.scrollLeft).toBe(7);
    controller.destroy();
    host.remove();
  });

  it("rejects authoring actions in a readonly editor", () => {
    const controller = createController("word", { readonly: true });
    select(controller, 2);
    expect(controller.applyMarkdownAction("bold")).toBe(false);
    expect(controller.getValue()).toBe("word");
  });
});

describe("line Markdown toolbar actions", () => {
  it("adds and removes exactly one H1 prefix at a caret within the line", () => {
    const result = apply("Paragraph", "heading", 4);
    expect(result.value).toBe("# Paragraph");
    expect(result.selection.anchor).toBe(6);

    expect(result.controller.applyMarkdownAction("heading")).toBe(true);
    expect(result.controller.getValue()).toBe("Paragraph");
    expect(result.controller.view.state.selection.main.anchor).toBe(4);
  });

  it("removes existing ATX and Setext heading syntax", () => {
    expect(apply("### Heading ###", "heading", 6).value).toBe("Heading");
    expect(apply("Heading\n=======", "heading", 3).value).toBe("Heading");
  });

  it("normalizes mixed selected lines to H1 and excludes a final column-zero line", () => {
    const source = "## Existing\nPlain\nUntouched";
    const result = apply(source, "heading", 0, source.indexOf("Untouched"));
    expect(result.value).toBe("# Existing\n# Plain\nUntouched");
  });

  it("normalizes mixed blockquote lines and toggles them off together", () => {
    const source = "> Quoted\nPlain\n\nLast";
    const result = apply(source, "quote", 0, source.length);
    expect(result.value).toBe("> Quoted\n> Plain\n>\n> Last");

    expect(result.controller.applyMarkdownAction("quote")).toBe(true);
    expect(result.controller.getValue()).toBe("Quoted\nPlain\n\nLast");
  });

  it("preserves list and quote ancestry when adding nested block prefixes", () => {
    expect(apply("- Item", "quote", 4).value).toBe("- > Item");
    expect(apply("> Item", "bulletList", 4).value).toBe("> - Item");
    expect(apply("> - Item", "heading", 6).value).toBe("> - # Item");
  });

  it("normalizes and converts bullet, ordered, and task markers", () => {
    const source = "- Bullet\n2. Ordered\n* [x] Done";
    const tasks = apply(source, "taskList", 0, source.length);
    expect(tasks.value).toBe("- [ ] Bullet\n- [ ] Ordered\n* [x] Done");

    const numbered = apply(tasks.value, "numberedList", 0, tasks.value.length);
    expect(numbered.value).toBe("1. Bullet\n1. Ordered\n1. Done");
  });

  it("removes custom task markers without leaving checkbox delimiters", () => {
    const source = "- [?] Question\n- [>] Forwarded";
    const result = apply(source, "taskList", 0, source.length);
    expect(result.value).toBe("Question\nForwarded");
  });

  it("skips selected blank rows for lists but starts a list on an empty caret line", () => {
    expect(apply("One\n\nTwo", "bulletList", 0, 8).value).toBe(
      "- One\n\n- Two",
    );
    expect(apply("", "numberedList", 0).value).toBe("1. ");
  });
});
