import {
  CompletionContext,
  type Completion,
  type CompletionResult,
  type CompletionSource,
} from "@codemirror/autocomplete";
import {
  EditorSelection,
  EditorState,
  type Extension,
  type TransactionSpec,
} from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { MiraFileAdapter, MiraFileRef } from "@lapismd/mira/extensions";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  convertHtmlToMarkdown,
  createMarkdownCompletionSources,
  createMarkdownInputHandlerExtensions,
  createMarkdownSmartPasteExtension,
} from ".";

const files: MiraFileRef[] = [
  {
    extension: "md",
    kind: "markdown",
    name: "project.md",
    path: "notes/project.md",
  },
  {
    extension: "png",
    kind: "image",
    name: "diagram.png",
    path: "assets/diagram.png",
  },
];

const adapter: MiraFileAdapter = {
  getHeadings(file) {
    return file.path === "notes/project.md"
      ? [{ id: "next-steps", level: 2, text: "Next Steps" }]
      : [];
  },
  listFiles: () => files,
  resolveLink({ href }) {
    const normalized = href.replace(/\.md$/i, "");
    return (
      files.find(
        (file) =>
          file.path.replace(/\.md$/i, "") === normalized ||
          file.name?.replace(/\.md$/i, "") === normalized ||
          file.path.replace(/\.md$/i, "").endsWith(`/${normalized}`),
      ) ?? null
    );
  },
};

afterEach(() => {
  document.body.replaceChildren();
});

describe("Markdown completions", () => {
  it("formats file and embed targets through the portable adapter", async () => {
    const sources = createMarkdownCompletionSources({
      fileAdapter: adapter,
      sourcePath: "notes/today.md",
    });

    const file = await firstResult(sources, "[[pro");
    expect(file.options.map((option) => option.label)).toContain("project.md");
    expect(applyCompletion("[[pro", file, "project.md")).toBe("[[project]]");

    const embed = await firstResult(sources, "![[dia");
    expect(embed.options.map((option) => option.label)).toContain(
      "diagram.png",
    );
    expect(applyCompletion("![[dia", embed, "diagram.png")).toBe(
      "![[diagram.png]]",
    );
  });

  it("completes headings while preserving existing display text", async () => {
    const sources = createMarkdownCompletionSources({
      fileAdapter: adapter,
      sourcePath: "notes/today.md",
    });
    const doc = "[[project#Ne|Alias]]";
    const position = doc.indexOf("|");
    const result = await firstResult(sources, doc, position);

    expect(result.options.map((option) => option.label)).toContain(
      "Next Steps",
    );
    expect(applyCompletion(doc, result, "Next Steps", position)).toBe(
      "[[project#Next Steps|Alias]]",
    );
  });

  it("resolves a unique basename from listFiles when resolveLink cannot", async () => {
    const sources = createMarkdownCompletionSources({
      fileAdapter: {
        ...adapter,
        resolveLink: () => null,
      },
      sourcePath: "notes/today.md",
    });
    const result = await firstResult(sources, "[[project#Ne");

    expect(applyCompletion("[[project#Ne", result, "Next Steps")).toBe(
      "[[project#Next Steps]]",
    );
  });

  it("completes display text without losing the selected target", async () => {
    const sources = createMarkdownCompletionSources({
      fileAdapter: adapter,
      sourcePath: "notes/today.md",
    });
    const result = await firstResult(sources, "[[project|Shown");

    expect(applyCompletion("[[project|Shown", result, "Shown")).toBe(
      "[[project|Shown]]",
    );
  });

  it("lets consumers replace the link formatter", async () => {
    const formatLink = vi.fn(
      (target: { targetPath: string; embed?: boolean }) =>
        `${target.embed ? "embed" : "link"}:${target.targetPath}`,
    );
    const sources = createMarkdownCompletionSources({
      config: { formatLink },
      fileAdapter: adapter,
      sourcePath: "notes/today.md",
    });
    const result = await firstResult(sources, "[[pro");

    expect(applyCompletion("[[pro", result, "project.md")).toBe(
      "link:notes/project.md",
    );
    expect(formatLink).toHaveBeenCalled();
  });
});

describe("Markdown input handlers", () => {
  it("scaffolds code fences and frontmatter by default", () => {
    expect(runInputHandler("``", "`")).toEqual({
      doc: "```\n```",
      selection: 3,
    });
    expect(runInputHandler("--", "-")).toEqual({
      doc: "---\n\n---",
      selection: 4,
    });
  });

  it("keeps ellipsis substitution opt-in", () => {
    expect(runInputHandler("..", ".")).toEqual({
      doc: "..",
      selection: 2,
    });
    expect(runInputHandler("..", ".", { ellipsis: true })).toEqual({
      doc: "…",
      selection: 1,
    });
  });
});

describe("Markdown smart paste", () => {
  it("converts rich HTML to Markdown", async () => {
    const markdown = await convertHtmlToMarkdown(
      "<h2>Plan</h2><ul><li>First</li><li>Second</li></ul>",
    );

    expect(markdown).toContain("## Plan");
    expect(markdown).toContain("* First");
    expect(markdown).toContain("* Second");
  });

  it("wraps the current selection when a URL is pasted", () => {
    const view = createView("Read Mira", 5, 9, [
      createMarkdownSmartPasteExtension(),
    ]);
    const event = pasteEvent({
      "text/plain": "https://mira.example/docs",
    });

    view.contentDOM.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(view.state.doc.toString()).toBe(
      "Read [Mira](https://mira.example/docs)",
    );
    view.destroy();
  });

  it("supports an application-supplied HTML converter", async () => {
    const view = createView("", 0, 0, [
      createMarkdownSmartPasteExtension({
        convertHtml: async () => "**converted**",
      }),
    ]);
    const event = pasteEvent({
      "text/html": "<strong>converted</strong>",
      "text/plain": "converted",
    });

    view.contentDOM.dispatchEvent(event);
    await vi.waitFor(() =>
      expect(view.state.doc.toString()).toBe("**converted**"),
    );

    expect(event.defaultPrevented).toBe(true);
    view.destroy();
  });
});

async function firstResult(
  sources: CompletionSource[],
  doc: string,
  position = doc.length,
): Promise<CompletionResult> {
  const state = EditorState.create({ doc });
  const context = new CompletionContext(state, position, true);
  for (const source of sources) {
    const result = await source(context);
    if (result) {
      return result;
    }
  }
  throw new Error(`No completion matched ${doc}`);
}

function applyCompletion(
  doc: string,
  result: CompletionResult,
  label: string,
  position = doc.length,
): string {
  const option = result.options.find((item) => item.label === label);
  if (!option || typeof option.apply !== "function") {
    throw new Error(`Missing completion ${label}`);
  }
  const state = EditorState.create({
    doc,
    selection: EditorSelection.cursor(position),
  });
  const view = mockView(state);
  option.apply(view, option as Completion, result.from, result.to ?? position);
  return view.state.doc.toString();
}

function runInputHandler(
  doc: string,
  text: string,
  config: Parameters<typeof createMarkdownInputHandlerExtensions>[0] = {},
): { doc: string; selection: number } {
  const state = EditorState.create({
    doc,
    selection: EditorSelection.cursor(doc.length),
    extensions: createMarkdownInputHandlerExtensions(config),
  });
  const view = mockView(state);
  const handled = state.facet(EditorView.inputHandler).some((handler) =>
    handler(view, doc.length, doc.length, text, () =>
      view.state.update({
        changes: { from: doc.length, insert: text, to: doc.length },
      }),
    ),
  );
  return {
    doc: view.state.doc.toString(),
    selection: handled ? view.state.selection.main.anchor : doc.length,
  };
}

function mockView(initialState: EditorState): EditorView {
  let state = initialState;
  return {
    dispatch(spec: TransactionSpec) {
      state = state.update(spec).state;
    },
    get state() {
      return state;
    },
  } as EditorView;
}

function createView(
  doc: string,
  from: number,
  to: number,
  extensions: Extension,
): EditorView {
  const parent = document.createElement("div");
  document.body.append(parent);
  return new EditorView({
    parent,
    state: EditorState.create({
      doc,
      extensions,
      selection: EditorSelection.range(from, to),
    }),
  });
}

function pasteEvent(data: Record<string, string>): Event {
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", {
    value: {
      getData(type: string) {
        return data[type] ?? "";
      },
      items: [],
    },
  });
  return event;
}
