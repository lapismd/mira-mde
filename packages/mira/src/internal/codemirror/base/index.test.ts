// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { CompletionContext } from "@codemirror/autocomplete";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import {
  createBaseCodeMirrorExtensions,
  createMarkdownTemplate,
  createSlashCommandCompletionSource,
  createSlashCommandExtensions,
  createSlashSnippet,
  type MiraSlashCommand,
} from ".";

const slashCommands: MiraSlashCommand[] = [
  createSlashSnippet({
    id: "heading",
    label: "Heading 1",
    description: "Large section heading",
    group: "Basic",
    keywords: ["h1"],
    markdown: "# <|>",
  }),
  createSlashSnippet({
    id: "quote",
    label: "Quote",
    description: "Create a quote",
    group: "Basic",
    keywords: ["blockquote"],
    markdown: "> <|>",
  }),
  createSlashSnippet({
    id: "table",
    label: "Table",
    description: "Insert a pipe table",
    group: "Blocks",
    keywords: ["tabular"],
    markdown: "| Column | Value |\n| --- | --- |\n| Item | Detail |\n",
  }),
];

function createSlashEditor(doc = "") {
  const parent = document.createElement("div");
  document.body.append(parent);
  const view = new EditorView({
    doc,
    selection: { anchor: doc.length },
    extensions: [
      createSlashCommandExtensions({
        commands: slashCommands,
      }),
    ],
    parent,
  });

  return {
    parent,
    view,
    destroy() {
      view.destroy();
      parent.remove();
    },
  };
}

function createAfterWhitespaceSlashEditor(doc = "") {
  const parent = document.createElement("div");
  document.body.append(parent);
  const view = new EditorView({
    doc,
    selection: { anchor: doc.length },
    extensions: [
      createSlashCommandExtensions({
        commands: slashCommands,
        triggerScope: "after-whitespace",
      }),
    ],
    parent,
  });

  return {
    parent,
    view,
    destroy() {
      view.destroy();
      parent.remove();
    },
  };
}

function insertText(view: EditorView, text: string): void {
  const selection = view.state.selection.main;
  view.dispatch({
    changes: {
      from: selection.from,
      to: selection.to,
      insert: text,
    },
    selection: {
      anchor: selection.from + text.length,
    },
  });
}

function pressKey(view: EditorView, key: string): void {
  view.contentDOM.dispatchEvent(
    new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key,
    }),
  );
}

function slashMenu(parent: HTMLElement): HTMLElement | null {
  return parent.querySelector(".mira-slash-menu");
}

function slashMenuTitles(parent: HTMLElement): string[] {
  return Array.from(
    parent.querySelectorAll<HTMLElement>(".mira-slash-menu__item-title"),
    (title) => title.textContent ?? "",
  );
}

describe("createBaseCodeMirrorExtensions", () => {
  it("returns a non-empty extension set", () => {
    expect(createBaseCodeMirrorExtensions()).not.toHaveLength(0);
  });

  it("uses muted monospaced tabular line numbers", () => {
    const parent = document.createElement("div");
    document.body.append(parent);

    const view = new EditorView({
      doc: Array.from({ length: 12 }, (_, index) => `Line ${index + 1}`).join(
        "\n",
      ),
      extensions: createBaseCodeMirrorExtensions(),
      parent,
    });
    const gutter = parent.querySelector<HTMLElement>(
      ".cm-gutter.cm-lineNumbers",
    );
    const number = gutter?.querySelector<HTMLElement>(".cm-gutterElement");

    expect(gutter).not.toBeNull();
    expect(number).not.toBeNull();
    expect(getComputedStyle(gutter!).fontFamily).toBe(
      "var(--font-monospace, var(--mira-font-mono))",
    );
    expect(getComputedStyle(gutter!).fontVariantNumeric).toBe("tabular-nums");
    expect(getComputedStyle(gutter!).color).toBe(
      "var(--text-faint, var(--mira-muted-foreground))",
    );
    expect(getComputedStyle(number!).justifyContent).toBe("end");

    view.destroy();
    parent.remove();
  });
});

describe("createSlashCommandExtensions", () => {
  it("is empty without commands", () => {
    expect(createSlashCommandExtensions()).toEqual([]);
  });

  it("completes slash commands after a slash trigger", () => {
    const source = createSlashCommandCompletionSource([
      {
        id: "heading",
        label: "Heading 1",
        group: "Basic",
        keywords: ["h1"],
        insert: "# ",
      },
      {
        id: "table",
        label: "Table",
        group: "Blocks",
        insert: "| Column |",
      },
    ]);
    const state = EditorState.create({ doc: "/h" });
    const result = source(new CompletionContext(state, 2, false));

    if (result instanceof Promise) {
      throw new Error("Expected synchronous slash completions.");
    }

    expect(result?.from).toBe(1);
    expect(result?.to).toBe(2);
    expect(result?.filter).toBe(false);
    expect(result?.options.map((option) => option.label)).toEqual([
      "Heading 1",
    ]);
  });

  it("does not complete slash commands in the middle of a word", () => {
    const source = createSlashCommandCompletionSource([
      {
        id: "heading",
        label: "Heading 1",
        insert: "# ",
      },
    ]);
    const state = EditorState.create({ doc: "word/h" });
    const result = source(new CompletionContext(state, 6, false));

    expect(result).toBeNull();
  });

  it("keeps the autocomplete UI path available", () => {
    expect(
      createSlashCommandExtensions({
        commands: slashCommands,
        ui: "autocomplete",
      }),
    ).not.toHaveLength(0);
  });
});

describe("slash command popover", () => {
  it("opens on slash at line start and after indentation", () => {
    const editor = createSlashEditor();
    insertText(editor.view, "/");

    expect(slashMenu(editor.parent)).not.toBeNull();
    editor.destroy();

    const indentedEditor = createSlashEditor("  ");
    insertText(indentedEditor.view, "/");

    expect(slashMenu(indentedEditor.parent)).not.toBeNull();
    indentedEditor.destroy();
  });

  it("does not open after prose, URLs, or paths", () => {
    for (const doc of ["word ", "https:/", "notes"]) {
      const editor = createSlashEditor(doc);
      insertText(editor.view, "/");

      expect(slashMenu(editor.parent)).toBeNull();
      editor.destroy();
    }
  });

  it("can opt into opening after whitespace", () => {
    const editor = createAfterWhitespaceSlashEditor("word ");
    insertText(editor.view, "/");

    expect(slashMenu(editor.parent)).not.toBeNull();

    editor.destroy();
  });

  it("filters commands by label, description, and keywords", () => {
    const editor = createSlashEditor();
    insertText(editor.view, "/tab");

    expect(slashMenuTitles(editor.parent)).toEqual(["Table"]);

    editor.view.dispatch({
      changes: { from: 0, to: editor.view.state.doc.length, insert: "/large" },
      selection: { anchor: 6 },
    });

    expect(slashMenuTitles(editor.parent)).toEqual(["Heading 1"]);

    editor.view.dispatch({
      changes: { from: 0, to: editor.view.state.doc.length, insert: "/block" },
      selection: { anchor: 6 },
    });

    expect(slashMenuTitles(editor.parent)).toEqual(["Quote"]);

    editor.destroy();
  });

  it("renders no menu when no commands match", () => {
    const editor = createSlashEditor();
    insertText(editor.view, "/missing");

    expect(slashMenu(editor.parent)).toBeNull();

    editor.destroy();
  });

  it("groups commands while preserving command order within groups", () => {
    const editor = createSlashEditor();
    insertText(editor.view, "/");

    expect(
      Array.from(
        editor.parent.querySelectorAll<HTMLElement>(".mira-slash-menu__group"),
        (group) => group.textContent,
      ),
    ).toEqual(["Basic", "Blocks"]);
    expect(slashMenuTitles(editor.parent)).toEqual([
      "Heading 1",
      "Quote",
      "Table",
    ]);

    editor.destroy();
  });

  it("navigates with wrapping arrow keys and applies the active command", () => {
    const editor = createSlashEditor();
    insertText(editor.view, "/");

    pressKey(editor.view, "ArrowUp");
    pressKey(editor.view, "Enter");

    expect(editor.view.state.doc.toString()).toBe(
      "| Column | Value |\n| --- | --- |\n| Item | Detail |\n",
    );
    expect(slashMenu(editor.parent)).toBeNull();

    editor.destroy();
  });

  it("applies a command selected by mouse", () => {
    const editor = createSlashEditor();
    insertText(editor.view, "/tab");

    editor.parent
      .querySelector<HTMLButtonElement>(".mira-slash-menu__item")
      ?.click();

    expect(editor.view.state.doc.toString()).toBe(
      "| Column | Value |\n| --- | --- |\n| Item | Detail |\n",
    );

    editor.destroy();
  });

  it("closes on escape, space, and backspace from an empty query", () => {
    const escapeEditor = createSlashEditor();
    insertText(escapeEditor.view, "/");
    pressKey(escapeEditor.view, "Escape");

    expect(slashMenu(escapeEditor.parent)).toBeNull();
    escapeEditor.destroy();

    const spaceEditor = createSlashEditor();
    insertText(spaceEditor.view, "/");
    insertText(spaceEditor.view, " ");

    expect(slashMenu(spaceEditor.parent)).toBeNull();
    spaceEditor.destroy();

    const backspaceEditor = createSlashEditor();
    insertText(backspaceEditor.view, "/");
    backspaceEditor.view.dispatch({
      changes: { from: 0, to: 1 },
      selection: { anchor: 0 },
    });

    expect(slashMenu(backspaceEditor.parent)).toBeNull();
    backspaceEditor.destroy();
  });

  it("places the cursor at the markdown template marker", () => {
    const editor = createSlashEditor();
    insertText(editor.view, "/h");
    pressKey(editor.view, "Enter");

    expect(editor.view.state.doc.toString()).toBe("# ");
    expect(editor.view.state.selection.main.head).toBe(2);

    editor.destroy();
  });
});

describe("slash snippet helpers", () => {
  it("creates templates and slash commands with cursor markers", () => {
    expect(createMarkdownTemplate("## <|>")).toEqual({
      markdown: "## ",
      selection: 3,
    });
    expect(
      createSlashSnippet({
        id: "math",
        label: "Math block",
        markdown: "$$\n<|>\n$$",
      }),
    ).toEqual({
      id: "math",
      label: "Math block",
      insert: {
        markdown: "$$\n\n$$",
        selection: 3,
      },
    });
  });
});
