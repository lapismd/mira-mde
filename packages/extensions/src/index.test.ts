import { describe, expect, it, vi } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import {
  createMiraCommandKeymap,
  createMarkdownTemplate,
  createSlashSnippet,
  defaultMiraListCallouts,
  defineMiraExtension,
  executeMiraCommand,
  isMiraCommandEnabled,
  mountMiraExtensionStyles,
  parseMiraFileTarget,
  resolveMiraExtensions,
  resolveMiraListCallouts,
} from ".";

describe("resolveMiraExtensions", () => {
  it("merges contribution arrays in extension order", () => {
    const first = defineMiraExtension({
      name: "first",
      remarkPlugins: [() => undefined],
      components: { a: "span" },
    });
    const second = defineMiraExtension({
      name: "second",
      rehypePlugins: [() => undefined],
      components: { b: "div" },
    });

    const resolved = resolveMiraExtensions([first, second], {
      mode: "source",
      readonly: false,
    });

    expect(resolved.remarkPlugins).toHaveLength(1);
    expect(resolved.rehypePlugins).toHaveLength(1);
    expect(resolved.components).toEqual({ a: "span", b: "div" });
  });

  it("merges slash commands in extension order", () => {
    const resolved = resolveMiraExtensions(
      [
        defineMiraExtension({
          name: "first",
          slashCommands: [
            {
              id: "heading",
              label: "Heading",
              insert: "# ",
            },
          ],
        }),
        defineMiraExtension({
          name: "second",
          slashCommands: [
            {
              id: "callout",
              label: "Callout",
              insert: "> [!note] ",
            },
          ],
        }),
      ],
      {
        mode: "source",
        readonly: false,
      },
    );

    expect(resolved.slashCommands.map((command) => command.id)).toEqual([
      "heading",
      "callout",
    ]);
  });

  it("merges block actions in extension order", () => {
    const resolved = resolveMiraExtensions(
      [
        defineMiraExtension({
          name: "first",
          blockActions: [
            {
              id: "duplicate",
              label: "Duplicate",
              run: () => undefined,
            },
          ],
        }),
        defineMiraExtension({
          name: "second",
          blockActions: [
            {
              id: "ask-ai",
              label: "Ask AI",
              run: () => undefined,
            },
          ],
        }),
      ],
      {
        mode: "source",
        readonly: false,
      },
    );

    expect(resolved.blockActions.map((action) => action.id)).toEqual([
      "duplicate",
      "ask-ai",
    ]);
  });

  it("merges list callouts and postprocessors in extension order", () => {
    const firstProcessor = vi.fn();
    const secondProcessor = vi.fn();
    const resolved = resolveMiraExtensions(
      [
        defineMiraExtension({
          name: "first",
          listCallouts: [{ char: "^", color: "80, 70, 220" }],
          postProcessors: [firstProcessor],
        }),
        defineMiraExtension({
          name: "second",
          listCallouts: [{ char: "@", color: "20, 160, 140" }],
          postProcessors: [secondProcessor],
        }),
      ],
      {
        mode: "preview",
        readonly: true,
      },
    );

    expect(resolved.listCallouts.map((callout) => callout.char)).toEqual([
      "^",
      "@",
    ]);
    expect(resolved.postProcessors).toEqual([firstProcessor, secondProcessor]);
  });
});

describe("extension runtime contributions", () => {
  const context = {
    focus: () => undefined,
    getValue: () => "",
    insertMarkdown: () => undefined,
    setValue: () => undefined,
  };

  it("executes the last enabled command with a matching id", () => {
    const first = vi.fn();
    const second = vi.fn();
    const commands = [
      { id: "save", label: "Save first", run: first },
      { id: "save", label: "Save second", run: second },
    ];

    expect(executeMiraCommand(commands, "save", context)).toBe(true);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(context);
  });

  it("does not execute disabled or unknown commands", () => {
    const run = vi.fn();
    const command = {
      id: "publish",
      label: "Publish",
      enabled: false,
      run,
    };

    expect(isMiraCommandEnabled(command, context)).toBe(false);
    expect(executeMiraCommand([command], "publish", context)).toBe(false);
    expect(executeMiraCommand([command], "missing", context)).toBe(false);
    expect(run).not.toHaveBeenCalled();
  });

  it("executes command shortcuts through a CodeMirror keymap", () => {
    const run = vi.fn();
    const extension = createMiraCommandKeymap(
      [
        {
          id: "save",
          label: "Save",
          keybindings: ["Ctrl-s"],
          run,
        },
      ],
      () => context,
    );
    const view = new EditorView({
      state: EditorState.create({
        extensions: [extension],
      }),
    });

    view.contentDOM.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        ctrlKey: true,
        key: "s",
      }),
    );

    expect(run).toHaveBeenCalledWith(context);
    view.destroy();
  });

  it("mounts and reference-counts external and inline styles", () => {
    const cleanupFirst = mountMiraExtensionStyles([
      "/extension.css",
      {
        id: "extension-inline",
        cssText: ".extension { color: rebeccapurple; }",
      },
    ]);
    const cleanupSecond = mountMiraExtensionStyles([
      "/extension.css",
      {
        id: "extension-inline",
        cssText: ".extension { color: rebeccapurple; }",
      },
    ]);

    expect(
      document.head.querySelectorAll("[data-mira-extension-style]"),
    ).toHaveLength(2);
    cleanupFirst();
    expect(
      document.head.querySelectorAll("[data-mira-extension-style]"),
    ).toHaveLength(2);
    cleanupSecond();
    expect(
      document.head.querySelectorAll("[data-mira-extension-style]"),
    ).toHaveLength(0);
  });
});

describe("portable file targets", () => {
  it("separates paths from heading and block fragments", () => {
    expect(parseMiraFileTarget("notes/plan.md#Next Steps", "daily.md")).toEqual(
      {
        href: "notes/plan.md#Next Steps",
        path: "notes/plan.md",
        sourcePath: "daily.md",
        subpath: "Next Steps",
        fragment: {
          kind: "heading",
          value: "Next Steps",
        },
      },
    );
    expect(parseMiraFileTarget("notes/plan.md#^decision-1")).toEqual({
      href: "notes/plan.md#^decision-1",
      path: "notes/plan.md",
      subpath: "^decision-1",
      fragment: {
        kind: "block",
        value: "decision-1",
      },
      sourcePath: undefined,
    });
  });

  it("keeps plain and empty-fragment targets portable", () => {
    expect(parseMiraFileTarget("notes/plan.md")).toEqual({
      href: "notes/plan.md",
      path: "notes/plan.md",
      sourcePath: undefined,
      subpath: undefined,
      fragment: undefined,
    });
    expect(parseMiraFileTarget("notes/plan.md#").fragment).toBeUndefined();
  });
});

describe("portable list callout catalogs", () => {
  it("overrides, disables, and appends markers without mutating defaults", () => {
    const callouts = resolveMiraListCallouts([
      { char: "@", color: "20, 160, 140", icon: "bookmark" },
      { char: "%", enabled: false },
      { char: "^", color: "80, 70, 220" },
    ]);

    expect(callouts.find((callout) => callout.char === "@")).toEqual({
      char: "@",
      color: "20, 160, 140",
      icon: "bookmark",
    });
    expect(callouts.some((callout) => callout.char === "%")).toBe(false);
    expect(callouts.at(-1)).toEqual({
      char: "^",
      color: "80, 70, 220",
    });
    expect(defaultMiraListCallouts).toHaveLength(7);
  });
});

describe("slash snippet helpers", () => {
  it("creates markdown templates from cursor markers", () => {
    expect(createMarkdownTemplate("## <|>")).toEqual({
      markdown: "## ",
      selection: 3,
    });
  });

  it("creates slash commands from markdown snippets", () => {
    expect(
      createSlashSnippet({
        id: "callout",
        label: "Callout",
        description: "Insert a callout",
        group: "Basic",
        keywords: ["note"],
        markdown: "> [!note] <|>\n> ",
      }),
    ).toEqual({
      id: "callout",
      label: "Callout",
      description: "Insert a callout",
      group: "Basic",
      keywords: ["note"],
      insert: {
        markdown: "> [!note] \n> ",
        selection: 10,
      },
    });
  });
});
