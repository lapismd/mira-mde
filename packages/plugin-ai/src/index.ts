import { StateEffect, type Extension } from "@codemirror/state";
import {
  EditorView,
  ViewPlugin,
  type PluginValue,
  type ViewUpdate,
} from "@codemirror/view";
import {
  collectMarkdownBlockRanges,
  defineMiraExtension,
  markdownBlockAt,
  replaceMarkdownRange,
  type MiraBlockAction,
  type MiraExtension,
  type MiraMarkdownBlockRange,
  type MiraSlashCommand,
  type MiraTextRange,
} from "@lapismd/mira/extensions";

export type MiraAiOperation = "generate" | "edit";

export type MiraAiScope = "cursor" | "selection" | "blocks";

export type MiraAiRequest = {
  operation: MiraAiOperation;
  scope: MiraAiScope;
  prompt: string;
  markdown: string;
  sourcePath?: string;
  selection: MiraTextRange | null;
  selectionMarkdown: string;
  blocks: MiraMarkdownBlockRange[];
  blockMarkdown: string;
  signal: AbortSignal;
};

export type MiraAiRunResult =
  | string
  | ReadableStream<string | Uint8Array>
  | AsyncIterable<string>;

export type MiraAiRun = (
  request: MiraAiRequest,
) => MiraAiRunResult | Promise<MiraAiRunResult>;

export type MiraAiExtensionOptions = {
  enabled?: boolean;
  run: MiraAiRun;
  slashCommand?: boolean;
  blockAction?: boolean;
  label?: string;
};

export type MiraAiOpenRequest = {
  operation?: MiraAiOperation;
  scope?: MiraAiScope;
  prompt?: string;
  blocks?: MiraMarkdownBlockRange[];
};

export type MiraAiToolbarActionContext = {
  focus?: () => void;
  getSelection?: () => MiraTextRange | null;
};

export type MiraAiToolbarActionOptions<TIcon = unknown> = {
  id?: string;
  label?: string;
  tooltip?: string;
  icon: TIcon;
  request?:
    | MiraAiOpenRequest
    | ((context: MiraAiToolbarActionContext) => MiraAiOpenRequest);
};

export type MiraAiToolbarAction<TIcon = unknown> = {
  type: "button";
  id: string;
  label: string;
  tooltip?: string;
  icon: TIcon;
  run: (context: MiraAiToolbarActionContext) => void;
};

const openMiraAiPromptEffect = StateEffect.define<MiraAiOpenRequest>();
let activeEditorView: EditorView | null = null;

export function aiExtension(options: MiraAiExtensionOptions): MiraExtension {
  if (options.enabled === false) {
    return defineMiraExtension({ name: "ai-disabled" });
  }

  const label = options.label ?? "Ask AI";
  const slashCommands =
    options.slashCommand === false ? [] : [createAiSlashCommand(label)];
  const blockActions =
    options.blockAction === false ? [] : [createAiBlockAction(label)];

  return defineMiraExtension({
    name: "ai",
    codeMirror(context) {
      if (context.readonly) {
        return [];
      }
      return createAiPromptExtension({
        run: options.run,
        sourcePath: context.sourcePath,
      });
    },
    slashCommands,
    blockActions,
  });
}

export function openMiraAiPrompt(
  view: unknown,
  request: MiraAiOpenRequest = {},
): boolean {
  if (!(view instanceof EditorView)) {
    return false;
  }

  view.dispatch({
    effects: openMiraAiPromptEffect.of(request),
  });
  return true;
}

export function openMiraAiPromptForActiveEditor(
  request: MiraAiOpenRequest = {},
): boolean {
  return openMiraAiPrompt(activeEditorView, request);
}

export function createMiraAiToolbarAction<TIcon = unknown>(
  options: MiraAiToolbarActionOptions<TIcon>,
): MiraAiToolbarAction<TIcon> {
  return {
    type: "button",
    id: options.id ?? "mira-ai-ask",
    label: options.label ?? "Ask AI",
    tooltip: options.tooltip ?? options.label ?? "Ask AI",
    icon: options.icon,
    run(context) {
      context.focus?.();
      const request =
        typeof options.request === "function"
          ? options.request(context)
          : (options.request ?? {});
      openMiraAiPromptForActiveEditor(request);
    },
  };
}

function createAiPromptExtension(options: {
  run: MiraAiRun;
  sourcePath?: string;
}): Extension[] {
  return [
    aiPromptTheme,
    ViewPlugin.fromClass(
      class extends AiPromptPlugin {
        constructor(view: EditorView) {
          super(view, options);
        }
      },
    ),
  ];
}

function createAiSlashCommand(label: string): MiraSlashCommand {
  return {
    id: "ask-ai",
    label,
    description: "Generate or edit with AI",
    group: "AI",
    keywords: ["ai", "ask", "generate", "edit"],
    run(context) {
      context.replaceRange("", context.range);
      openMiraAiPrompt(context.view, { scope: "cursor" });
    },
  };
}

function createAiBlockAction(label: string): MiraBlockAction {
  return {
    id: "mira-ai-ask",
    label,
    run(context) {
      openMiraAiPrompt(context.view, {
        operation: "edit",
        scope: "blocks",
        blocks: context.blocks,
      });
    },
  };
}

class AiPromptPlugin implements PluginValue {
  private panel: HTMLDivElement | null = null;
  private promptInput: HTMLTextAreaElement | null = null;
  private operationSelect: HTMLSelectElement | null = null;
  private preview: HTMLPreElement | null = null;
  private status: HTMLSpanElement | null = null;
  private acceptButton: HTMLButtonElement | null = null;
  private stopButton: HTMLButtonElement | null = null;
  private abortController: AbortController | null = null;
  private positionFrame: number | null = null;
  private output = "";
  private lastRequest: MiraAiRequest | null = null;
  private openRequest: MiraAiOpenRequest = {};

  constructor(
    private readonly view: EditorView,
    private readonly options: { run: MiraAiRun; sourcePath?: string },
  ) {
    this.view.dom.addEventListener("focusin", this.handleFocusIn);
    this.view.dom.addEventListener("mousedown", this.handleMouseDown);
  }

  update(update: ViewUpdate): void {
    for (const effect of update.transactions.flatMap(
      (transaction) => transaction.effects,
    )) {
      if (effect.is(openMiraAiPromptEffect)) {
        this.open(effect.value);
      }
    }

    if (update.docChanged && this.panel && !this.abortController) {
      this.schedulePositionPanel();
    }
  }

  destroy(): void {
    this.close();
    this.view.dom.removeEventListener("focusin", this.handleFocusIn);
    this.view.dom.removeEventListener("mousedown", this.handleMouseDown);
    if (this.positionFrame !== null) {
      cancelAnimationFrame(this.positionFrame);
      this.positionFrame = null;
    }
    if (activeEditorView === this.view) {
      activeEditorView = null;
    }
  }

  private readonly handleFocusIn = (): void => {
    activeEditorView = this.view;
  };

  private readonly handleMouseDown = (): void => {
    activeEditorView = this.view;
  };

  private open(request: MiraAiOpenRequest): void {
    this.close();
    this.openRequest = request;
    this.output = "";
    this.lastRequest = null;

    const panel = document.createElement("div");
    panel.className = "mira-ai-popover";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Ask AI");
    panel.onmousedown = (event) => {
      event.preventDefault();
    };

    const form = document.createElement("form");
    form.className = "mira-ai-popover__form";
    form.onsubmit = (event) => {
      event.preventDefault();
      void this.submit();
    };

    const promptInput = document.createElement("textarea");
    promptInput.className = "mira-ai-popover__prompt";
    promptInput.placeholder = "Ask AI";
    promptInput.rows = 3;
    promptInput.value = request.prompt ?? "";
    promptInput.setAttribute("aria-label", "AI prompt");

    const operationSelect = document.createElement("select");
    operationSelect.className = "mira-ai-popover__operation";
    operationSelect.setAttribute("aria-label", "AI operation");
    operationSelect.append(
      optionElement("generate", "Generate"),
      optionElement("edit", "Edit"),
    );
    operationSelect.value = request.operation ?? this.defaultOperation();

    const controls = document.createElement("div");
    controls.className = "mira-ai-popover__controls";

    const runButton = document.createElement("button");
    runButton.type = "submit";
    runButton.className = "mira-ai-popover__button";
    runButton.textContent = "Run";

    const stopButton = document.createElement("button");
    stopButton.type = "button";
    stopButton.className = "mira-ai-popover__button";
    stopButton.textContent = "Stop";
    stopButton.disabled = true;
    stopButton.onclick = () => this.abort();

    const acceptButton = document.createElement("button");
    acceptButton.type = "button";
    acceptButton.className =
      "mira-ai-popover__button mira-ai-popover__button--primary";
    acceptButton.textContent = "Accept";
    acceptButton.disabled = true;
    acceptButton.onclick = () => this.accept();

    const discardButton = document.createElement("button");
    discardButton.type = "button";
    discardButton.className = "mira-ai-popover__button";
    discardButton.textContent = "Discard";
    discardButton.onclick = () => this.close();

    const status = document.createElement("span");
    status.className = "mira-ai-popover__status";

    controls.append(runButton, stopButton, acceptButton, discardButton, status);

    const preview = document.createElement("pre");
    preview.className = "mira-ai-popover__preview";
    preview.hidden = true;

    form.append(promptInput, operationSelect, controls, preview);
    panel.append(form);
    this.view.dom.append(panel);

    this.panel = panel;
    this.promptInput = promptInput;
    this.operationSelect = operationSelect;
    this.preview = preview;
    this.status = status;
    this.acceptButton = acceptButton;
    this.stopButton = stopButton;
    panel.style.top = "8px";
    panel.style.left = "8px";
    this.schedulePositionPanel();
    promptInput.focus();
    promptInput.select();
  }

  private defaultOperation(): MiraAiOperation {
    if (this.openRequest.operation) {
      return this.openRequest.operation;
    }
    if (this.openRequest.scope === "blocks") {
      return "edit";
    }
    return this.view.state.selection.main.empty ? "generate" : "edit";
  }

  private schedulePositionPanel(): void {
    if (this.positionFrame !== null) {
      return;
    }
    this.positionFrame = requestAnimationFrame(() => {
      this.positionFrame = null;
      this.positionPanel();
    });
  }

  private positionPanel(): void {
    if (!this.panel) {
      return;
    }

    const rootRect = this.view.dom.getBoundingClientRect();
    const selection = this.view.state.selection.main;
    const coords =
      this.view.coordsAtPos(selection.head) ?? this.view.coordsAtPos(0);
    const top = coords ? coords.bottom - rootRect.top + 8 : 32;
    const left = coords ? coords.left - rootRect.left : 32;

    this.panel.style.top = `${Math.max(8, top)}px`;
    this.panel.style.left = `${Math.max(8, left)}px`;
  }

  private async submit(): Promise<void> {
    if (!this.promptInput || !this.operationSelect) {
      return;
    }

    this.abort();
    this.output = "";
    this.updatePreview();
    this.abortController = new AbortController();
    this.setBusy(true);

    const request = this.buildRequest(
      this.operationSelect.value as MiraAiOperation,
      this.promptInput.value,
      this.abortController.signal,
    );
    this.lastRequest = request;

    try {
      await consumeAiRunResult(
        await this.options.run(request),
        (chunk) => {
          this.output += chunk;
          this.updatePreview();
        },
        request.signal,
      );
      if (!request.signal.aborted) {
        this.setStatus("Ready");
      }
    } catch (error) {
      if (isAbortError(error)) {
        this.output = "";
        this.updatePreview();
        this.setStatus("");
      } else {
        this.setStatus(error instanceof Error ? error.message : "AI failed");
      }
    } finally {
      if (this.abortController?.signal === request.signal) {
        this.abortController = null;
      }
      this.setBusy(false);
    }
  }

  private buildRequest(
    operation: MiraAiOperation,
    prompt: string,
    signal: AbortSignal,
  ): MiraAiRequest {
    const markdown = this.view.state.doc.toString();
    const selectionRange = selectedTextRange(this.view);
    const scope = this.resolveScope(operation, selectionRange);
    const blocks = selectedAiBlocks(this.view, scope, this.openRequest.blocks);
    const selectionMarkdown = selectionRange
      ? this.view.state.doc.sliceString(selectionRange.from, selectionRange.to)
      : "";

    return {
      operation,
      scope,
      prompt,
      markdown,
      sourcePath: this.options.sourcePath,
      selection: selectionRange,
      selectionMarkdown,
      blocks,
      blockMarkdown: blocks.map((block) => block.text).join("\n\n"),
      signal,
    };
  }

  private resolveScope(
    operation: MiraAiOperation,
    selectionRange: MiraTextRange | null,
  ): MiraAiScope {
    if (this.openRequest.scope) {
      return this.openRequest.scope;
    }
    if (selectionRange) {
      return "selection";
    }
    return operation === "edit" ? "blocks" : "cursor";
  }

  private accept(): void {
    if (!this.lastRequest || !this.output) {
      return;
    }

    if (this.lastRequest.operation === "generate") {
      const at =
        this.lastRequest.selection?.to ?? this.view.state.selection.main.head;
      replaceMarkdownRange(
        this.view,
        insertionMarkdown(this.view, at, this.output),
        {
          from: at,
          to: at,
        },
      );
    } else {
      const range = this.lastRequest.selection ??
        blockReplacementRange(this.lastRequest.blocks) ?? {
          from: this.view.state.selection.main.from,
          to: this.view.state.selection.main.to,
        };
      replaceMarkdownRange(this.view, this.output, range);
    }

    this.close();
    this.view.focus();
  }

  private abort(): void {
    this.abortController?.abort();
    this.abortController = null;
    this.output = "";
    this.updatePreview();
    this.setBusy(false);
  }

  private close(): void {
    this.abort();
    this.panel?.remove();
    this.panel = null;
    this.promptInput = null;
    this.operationSelect = null;
    this.preview = null;
    this.status = null;
    this.acceptButton = null;
    this.stopButton = null;
    this.lastRequest = null;
  }

  private setBusy(busy: boolean): void {
    if (this.stopButton) {
      this.stopButton.disabled = !busy;
    }
  }

  private setStatus(value: string): void {
    if (this.status) {
      this.status.textContent = value;
    }
  }

  private updatePreview(): void {
    if (this.preview) {
      this.preview.textContent = this.output;
      this.preview.hidden = this.output.length === 0;
    }
    if (this.acceptButton) {
      this.acceptButton.disabled = this.output.length === 0;
    }
  }
}

function optionElement(
  value: MiraAiOperation,
  label: string,
): HTMLOptionElement {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function selectedTextRange(view: EditorView): MiraTextRange | null {
  const selection = view.state.selection.main;
  return selection.empty ? null : { from: selection.from, to: selection.to };
}

function selectedAiBlocks(
  view: EditorView,
  scope: MiraAiScope,
  openBlocks: MiraMarkdownBlockRange[] | undefined,
): MiraMarkdownBlockRange[] {
  if (openBlocks?.length) {
    return openBlocks;
  }
  if (scope !== "blocks") {
    return [];
  }

  const blocks = collectMarkdownBlockRanges(view.state);
  const selection = view.state.selection.main;
  if (selection.empty) {
    const active = markdownBlockAt(view.state, selection.head);
    return active ? [active] : [];
  }

  return blocks.filter(
    (block) => selection.from <= block.to && selection.to >= block.from,
  );
}

function blockReplacementRange(
  blocks: MiraMarkdownBlockRange[],
): MiraTextRange | null {
  if (blocks.length === 0) {
    return null;
  }
  const sorted = [...blocks].sort((a, b) => a.from - b.from);
  return {
    from: sorted[0]!.from,
    to: sorted.at(-1)!.to,
  };
}

function insertionMarkdown(
  view: EditorView,
  position: number,
  markdown: string,
): string {
  const doc = view.state.doc;
  const before = position > 0 ? doc.sliceString(position - 1, position) : "";
  const after =
    position < doc.length ? doc.sliceString(position, position + 1) : "";
  const prefix =
    before && before !== "\n" && !markdown.startsWith("\n") ? "\n" : "";
  const suffix =
    after && after !== "\n" && !markdown.endsWith("\n") ? "\n" : "";
  return `${prefix}${markdown}${suffix}`;
}

async function consumeAiRunResult(
  result: MiraAiRunResult,
  onChunk: (chunk: string) => void,
  signal: AbortSignal,
): Promise<void> {
  throwIfAborted(signal);

  if (typeof result === "string") {
    onChunk(result);
    return;
  }

  if (isReadableStream(result)) {
    await consumeReadableStream(result, onChunk, signal);
    return;
  }

  for await (const chunk of result) {
    throwIfAborted(signal);
    onChunk(String(chunk));
  }
}

async function consumeReadableStream(
  stream: ReadableStream<string | Uint8Array>,
  onChunk: (chunk: string) => void,
  signal: AbortSignal,
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      throwIfAborted(signal);
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (typeof value === "string") {
        onChunk(value);
      } else if (value) {
        onChunk(decoder.decode(value, { stream: true }));
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function isReadableStream(
  value: MiraAiRunResult,
): value is ReadableStream<string | Uint8Array> {
  return typeof (value as ReadableStream<string>).getReader === "function";
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new DOMException("AI request aborted", "AbortError");
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

const aiPromptTheme = EditorView.theme({
  "&": {
    position: "relative",
  },
  ".mira-ai-popover": {
    background: "var(--mira-popover)",
    border: "1px solid var(--mira-border)",
    borderRadius: "var(--mira-radius)",
    boxShadow: "var(--mira-widget-shadow)",
    color: "var(--mira-popover-foreground)",
    fontFamily: "var(--mira-font-sans)",
    maxWidth: "min(28rem, calc(100% - 1rem))",
    padding: "8px",
    pointerEvents: "auto",
    position: "absolute",
    width: "22rem",
    zIndex: "40",
  },
  ".mira-ai-popover__form": {
    display: "grid",
    gap: "8px",
  },
  ".mira-ai-popover__prompt": {
    background: "var(--mira-background)",
    border: "1px solid var(--mira-border)",
    borderRadius: "4px",
    color: "inherit",
    font: "inherit",
    lineHeight: "1.45",
    minHeight: "4.5rem",
    padding: "8px",
    resize: "vertical",
  },
  ".mira-ai-popover__operation": {
    background: "var(--mira-background)",
    border: "1px solid var(--mira-border)",
    borderRadius: "4px",
    color: "inherit",
    font: "inherit",
    padding: "5px 7px",
  },
  ".mira-ai-popover__controls": {
    alignItems: "center",
    display: "flex",
    gap: "6px",
  },
  ".mira-ai-popover__button": {
    background: "transparent",
    border: "1px solid var(--mira-border)",
    borderRadius: "4px",
    color: "inherit",
    cursor: "pointer",
    font: "inherit",
    padding: "5px 8px",
  },
  ".mira-ai-popover__button:hover, .mira-ai-popover__button:focus-visible": {
    background: "var(--mira-accent-soft)",
    outline: "none",
  },
  ".mira-ai-popover__button:disabled": {
    cursor: "not-allowed",
    opacity: "0.5",
  },
  ".mira-ai-popover__button--primary": {
    background: "var(--mira-accent)",
    borderColor: "var(--mira-accent)",
    color: "var(--mira-accent-foreground, white)",
  },
  ".mira-ai-popover__status": {
    color: "var(--mira-muted-foreground)",
    fontSize: "12px",
    marginInlineStart: "auto",
  },
  ".mira-ai-popover__preview": {
    background: "var(--mira-muted)",
    border: "1px solid var(--mira-border)",
    borderRadius: "4px",
    fontFamily: "var(--mira-font-mono)",
    fontSize: "12px",
    lineHeight: "1.45",
    margin: "0",
    maxHeight: "12rem",
    overflow: "auto",
    padding: "8px",
    whiteSpace: "pre-wrap",
  },
});

export default aiExtension;
