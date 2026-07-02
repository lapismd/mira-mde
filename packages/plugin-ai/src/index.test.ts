import { EditorState, type Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { describe, expect, it, vi } from "vitest";
import {
  aiExtension,
  openMiraAiPrompt,
  type MiraAiRequest,
  type MiraAiRun,
} from ".";

function createEditor({
  doc,
  run,
  selection,
}: {
  doc: string;
  run: MiraAiRun;
  selection?: { anchor: number; head?: number };
}): { parent: HTMLElement; view: EditorView; destroy: () => void } {
  const parent = document.createElement("div");
  const extension = aiExtension({ run });
  const contribution = extension.codeMirror?.({
    mode: "live-preview",
    readonly: false,
    sourcePath: "notes/example.md",
  });
  document.body.append(parent);
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc,
      selection,
      extensions: [contribution].flat().filter(Boolean) as Extension[],
    }),
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

function prompt(parent: HTMLElement): HTMLTextAreaElement {
  return parent.querySelector<HTMLTextAreaElement>(".mira-ai-popover__prompt")!;
}

function operation(parent: HTMLElement): HTMLSelectElement {
  return parent.querySelector<HTMLSelectElement>(
    ".mira-ai-popover__operation",
  )!;
}

function preview(parent: HTMLElement): HTMLPreElement {
  return parent.querySelector<HTMLPreElement>(".mira-ai-popover__preview")!;
}

function button(parent: HTMLElement, label: string): HTMLButtonElement {
  return Array.from(
    parent.querySelectorAll<HTMLButtonElement>(".mira-ai-popover__button"),
  ).find((element) => element.textContent === label)!;
}

function submit(parent: HTMLElement): void {
  parent
    .querySelector<HTMLFormElement>(".mira-ai-popover__form")!
    .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}

describe("aiExtension", () => {
  it("contributes slash and block AI actions", () => {
    const extension = aiExtension({ run: () => "Done" });

    expect(extension.slashCommands?.map((command) => command.id)).toEqual([
      "ask-ai",
    ]);
    expect(extension.blockActions?.map((action) => action.id)).toEqual([
      "mira-ai-ask",
    ]);
  });

  it("streams an edit preview without mutating until accept", async () => {
    let request!: MiraAiRequest;
    const run = vi.fn((nextRequest: MiraAiRequest) => {
      request = nextRequest;
      return (async function* stream() {
        yield "Better";
      })();
    });
    const editor = createEditor({
      doc: "Alpha\n\nBeta",
      run,
      selection: { anchor: 0, head: 5 },
    });

    openMiraAiPrompt(editor.view, { operation: "edit" });
    prompt(editor.parent).value = "Improve this";
    submit(editor.parent);

    await vi.waitFor(() =>
      expect(preview(editor.parent).textContent).toBe("Better"),
    );
    expect(editor.view.state.doc.toString()).toBe("Alpha\n\nBeta");
    expect(request).toMatchObject({
      operation: "edit",
      scope: "selection",
      prompt: "Improve this",
      sourcePath: "notes/example.md",
      selection: { from: 0, to: 5 },
      selectionMarkdown: "Alpha",
    });
    expect(request.markdown).toBe("Alpha\n\nBeta");
    expect(request.signal.aborted).toBe(false);

    button(editor.parent, "Accept").click();

    expect(editor.view.state.doc.toString()).toBe("Better\n\nBeta");
    editor.destroy();
  });

  it("discards generated previews without document changes", async () => {
    const editor = createEditor({
      doc: "Alpha",
      run: () => "Generated",
      selection: { anchor: 5 },
    });

    openMiraAiPrompt(editor.view, { operation: "generate", scope: "cursor" });
    prompt(editor.parent).value = "Continue";
    submit(editor.parent);

    await vi.waitFor(() =>
      expect(preview(editor.parent).textContent).toBe("Generated"),
    );
    button(editor.parent, "Discard").click();

    expect(editor.view.state.doc.toString()).toBe("Alpha");
    editor.destroy();
  });

  it("aborts streaming and clears preview state", async () => {
    let request!: MiraAiRequest;
    const run = vi.fn((nextRequest: MiraAiRequest) => {
      request = nextRequest;
      return (async function* stream() {
        yield "Partial";
        await new Promise((_resolve, reject) => {
          nextRequest.signal.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          );
        });
      })();
    });
    const editor = createEditor({
      doc: "Alpha",
      run,
      selection: { anchor: 5 },
    });

    openMiraAiPrompt(editor.view, { operation: "generate", scope: "cursor" });
    operation(editor.parent).value = "generate";
    submit(editor.parent);

    await vi.waitFor(() =>
      expect(preview(editor.parent).textContent).toBe("Partial"),
    );
    button(editor.parent, "Stop").click();

    await vi.waitFor(() => expect(request.signal.aborted).toBe(true));
    expect(preview(editor.parent).textContent).toBe("");
    expect(editor.view.state.doc.toString()).toBe("Alpha");
    editor.destroy();
  });
});
