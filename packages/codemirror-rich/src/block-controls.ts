import { Prec, type Extension } from "@codemirror/state";
import {
  EditorView,
  keymap,
  type KeyBinding,
  type PluginValue,
  type ViewUpdate,
  ViewPlugin,
} from "@codemirror/view";
import type {
  MiraBlockAction,
  MiraBlockActionContext,
  MiraMarkdownBlockRange,
} from "@mira-mde/extensions";
import type { MiraRichEditorOptions } from "./types";
import {
  collectMarkdownBlockRanges,
  deleteMarkdownBlockRange,
  duplicateMarkdownBlockRange,
  moveMarkdownBlockRange,
  replaceMarkdownRange,
} from "./block-ranges";

type BlockRect = {
  block: MiraMarkdownBlockRange;
  top: number;
  bottom: number;
};

type DragState = {
  blockId: string;
  dragging: boolean;
  startX: number;
  startY: number;
};

type DropTarget = {
  block: MiraMarkdownBlockRange;
  position: "before" | "after";
  top: number;
};

const dragActivationDistance = 5;
const autoScrollThreshold = 42;
const autoScrollStep = 18;

export function blockControlExtensions(
  options: MiraRichEditorOptions,
): Extension[] {
  if (options.blockControls !== true) {
    return [];
  }

  return [
    blockControlsTheme,
    Prec.highest(keymap.of(blockControlKeymap())),
    ViewPlugin.fromClass(
      class extends BlockControlsPlugin {
        constructor(view: EditorView) {
          super(view, options);
        }
      },
    ),
  ];
}

function blockControlKeymap(): KeyBinding[] {
  return [
    {
      key: "Alt-Shift-ArrowUp",
      run(view) {
        return moveSelectionByKeyboard(view, -1);
      },
      preventDefault: true,
    },
    {
      key: "Alt-Shift-ArrowDown",
      run(view) {
        return moveSelectionByKeyboard(view, 1);
      },
      preventDefault: true,
    },
  ];
}

function moveSelectionByKeyboard(view: EditorView, direction: -1 | 1): boolean {
  const blocks = collectMarkdownBlockRanges(view.state);
  const active = activeBlock(view, blocks);
  if (!active) {
    return false;
  }

  const selectionBlocks = selectedBlocks(view, blocks, active);
  const source = compositeBlock(view, selectionBlocks);
  const firstIndex = blocks.findIndex(
    (block) => block.id === selectionBlocks[0]?.id,
  );
  const lastIndex = blocks.findIndex(
    (block) => block.id === selectionBlocks.at(-1)?.id,
  );
  const target = direction < 0 ? blocks[firstIndex - 1] : blocks[lastIndex + 1];

  if (!target) {
    return false;
  }

  return moveMarkdownBlockRange(view, source, {
    block: target,
    position: direction < 0 ? "before" : "after",
  });
}

class BlockControlsPlugin implements PluginValue {
  private readonly layer = document.createElement("div");
  private readonly dropLine = document.createElement("div");
  private readonly menu = document.createElement("div");
  private blocks: MiraMarkdownBlockRange[] = [];
  private blockRects: BlockRect[] = [];
  private dragState: DragState | null = null;
  private dropTarget: DropTarget | null = null;
  private renderFrame: number | null = null;
  private suppressNextClick = false;

  constructor(
    private readonly view: EditorView,
    private readonly options: MiraRichEditorOptions,
  ) {
    this.layer.className = "mira-block-controls-layer";
    this.dropLine.className = "mira-block-drop-line";
    this.menu.className = "mira-block-menu";
    this.menu.setAttribute("role", "menu");
    this.menu.hidden = true;
    this.layer.append(this.dropLine, this.menu);
    this.view.dom.append(this.layer);

    this.view.scrollDOM.addEventListener("scroll", this.scheduleRender);
    window.addEventListener("resize", this.scheduleRender);
    document.addEventListener("pointerdown", this.handleDocumentPointerDown, {
      capture: true,
    });
    document.addEventListener("keydown", this.handleDocumentKeyDown);

    this.scheduleRender();
  }

  update(update: ViewUpdate): void {
    if (
      update.docChanged ||
      update.selectionSet ||
      update.viewportChanged ||
      update.geometryChanged
    ) {
      this.closeMenu();
      this.scheduleRender();
    }
  }

  destroy(): void {
    this.view.scrollDOM.removeEventListener("scroll", this.scheduleRender);
    window.removeEventListener("resize", this.scheduleRender);
    document.removeEventListener(
      "pointerdown",
      this.handleDocumentPointerDown,
      {
        capture: true,
      },
    );
    document.removeEventListener("keydown", this.handleDocumentKeyDown);
    this.detachDragListeners();
    if (this.renderFrame !== null) {
      cancelAnimationFrame(this.renderFrame);
    }
    this.layer.remove();
  }

  private readonly scheduleRender = (): void => {
    if (this.renderFrame !== null) {
      return;
    }
    this.renderFrame = requestAnimationFrame(() => {
      this.renderFrame = null;
      this.render();
    });
  };

  private render(): void {
    this.blocks = collectMarkdownBlockRanges(this.view.state);
    this.blockRects = [];
    const rootRect = this.view.dom.getBoundingClientRect();
    const fragment = document.createDocumentFragment();
    fragment.append(this.dropLine, this.menu);

    for (const block of this.blocks) {
      const rect = this.measureBlock(block, rootRect);
      if (!rect) {
        continue;
      }
      this.blockRects.push({ block, top: rect.top, bottom: rect.bottom });
      fragment.append(this.createHandle(block, rect.top));
    }

    this.layer.replaceChildren(fragment);
    if (this.dropTarget) {
      this.showDropLine(this.dropTarget.top);
    } else {
      this.hideDropLine();
    }
  }

  private measureBlock(
    block: MiraMarkdownBlockRange,
    rootRect: DOMRect,
  ): { top: number; bottom: number } | null {
    const start = this.view.coordsAtPos(block.from);
    const end = this.view.coordsAtPos(block.to);
    if (!start && !end) {
      return null;
    }

    const top = (start?.top ?? end!.top) - rootRect.top;
    const bottom = Math.max(
      (end?.bottom ?? start!.bottom) - rootRect.top,
      top + 18,
    );
    return { top, bottom };
  }

  private createHandle(
    block: MiraMarkdownBlockRange,
    top: number,
  ): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mira-block-handle";
    button.dataset.miraBlockId = block.id;
    button.setAttribute("aria-label", "Block actions");
    button.setAttribute("title", "Drag to move. Click for block actions.");
    button.style.top = `${Math.max(0, top)}px`;
    button.innerHTML =
      '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01"/></svg>';
    button.addEventListener("pointerdown", (event) =>
      this.handlePointerDown(event, block),
    );
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (this.suppressNextClick) {
        this.suppressNextClick = false;
        return;
      }
      this.openMenu(block, button);
    });
    return button;
  }

  private handlePointerDown(
    event: PointerEvent,
    block: MiraMarkdownBlockRange,
  ): void {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.closeMenu();
    this.dragState = {
      blockId: block.id,
      dragging: false,
      startX: event.clientX,
      startY: event.clientY,
    };
    window.addEventListener("pointermove", this.handlePointerMove);
    window.addEventListener("pointerup", this.handlePointerUp, { once: true });
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.dragState) {
      return;
    }

    const distance = Math.hypot(
      event.clientX - this.dragState.startX,
      event.clientY - this.dragState.startY,
    );
    if (!this.dragState.dragging && distance < dragActivationDistance) {
      return;
    }

    event.preventDefault();
    this.dragState.dragging = true;
    this.suppressNextClick = true;
    this.view.dom.classList.add("mira-block-controls-dragging");
    this.dropTarget = this.resolveDropTarget(event.clientY);
    if (this.dropTarget) {
      this.showDropLine(this.dropTarget.top);
    }
    this.autoScroll(event.clientY);
  };

  private readonly handlePointerUp = (): void => {
    const dragState = this.dragState;
    const source = dragState
      ? this.blocks.find((block) => block.id === dragState.blockId)
      : undefined;

    if (dragState?.dragging && source && this.dropTarget) {
      const selectionBlocks = selectedBlocks(this.view, this.blocks, source);
      moveMarkdownBlockRange(
        this.view,
        compositeBlock(this.view, selectionBlocks),
        {
          block: this.dropTarget.block,
          position: this.dropTarget.position,
        },
      );
    }

    this.dragState = null;
    this.dropTarget = null;
    this.view.dom.classList.remove("mira-block-controls-dragging");
    this.hideDropLine();
    this.detachDragListeners();
    this.scheduleRender();
  };

  private detachDragListeners(): void {
    window.removeEventListener("pointermove", this.handlePointerMove);
  }

  private resolveDropTarget(clientY: number): DropTarget | null {
    const sourceId = this.dragState?.blockId;
    const candidates = this.blockRects.filter(
      (rect) => rect.block.id !== sourceId,
    );
    if (candidates.length === 0) {
      return null;
    }

    const rootTop = this.view.dom.getBoundingClientRect().top;
    const localY = clientY - rootTop;
    let nearest = candidates[0]!;
    let nearestDistance = Number.POSITIVE_INFINITY;
    let position: "before" | "after" = "before";

    for (const rect of candidates) {
      const midpoint = (rect.top + rect.bottom) / 2;
      const beforeDistance = Math.abs(localY - rect.top);
      const afterDistance = Math.abs(localY - rect.bottom);
      const distance = Math.min(beforeDistance, afterDistance);
      if (distance < nearestDistance) {
        nearest = rect;
        nearestDistance = distance;
        position = localY < midpoint ? "before" : "after";
      }
    }

    return {
      block: nearest.block,
      position,
      top: position === "before" ? nearest.top : nearest.bottom,
    };
  }

  private showDropLine(top: number): void {
    this.dropLine.hidden = false;
    this.dropLine.style.top = `${Math.max(0, top)}px`;
  }

  private hideDropLine(): void {
    this.dropLine.hidden = true;
  }

  private autoScroll(clientY: number): void {
    const rect = this.view.scrollDOM.getBoundingClientRect();
    if (clientY < rect.top + autoScrollThreshold) {
      this.view.scrollDOM.scrollTop -= autoScrollStep;
    } else if (clientY > rect.bottom - autoScrollThreshold) {
      this.view.scrollDOM.scrollTop += autoScrollStep;
    }
  }

  private openMenu(
    block: MiraMarkdownBlockRange,
    handle: HTMLButtonElement,
  ): void {
    const actions = this.actionsFor(block);
    const rect = handle.getBoundingClientRect();
    const rootRect = this.view.dom.getBoundingClientRect();
    this.menu.replaceChildren(
      ...actions.map((action) => this.createMenuItem(action, block)),
    );
    this.menu.hidden = false;
    this.menu.style.top = `${rect.top - rootRect.top}px`;
    this.menu.style.left = `${rect.right - rootRect.left + 6}px`;
    this.menu.querySelector<HTMLButtonElement>("button")?.focus();
  }

  private createMenuItem(
    action: MiraBlockAction,
    block: MiraMarkdownBlockRange,
  ): HTMLButtonElement {
    const context = this.actionContext(block);
    const button = document.createElement("button");
    button.type = "button";
    button.className = action.destructive
      ? "mira-block-menu__item mira-block-menu__item--destructive"
      : "mira-block-menu__item";
    button.setAttribute("role", "menuitem");
    button.textContent = action.label;
    button.disabled = dynamicDisabled(action, context);
    button.onclick = () => {
      void action.run(context);
      this.closeMenu();
      this.view.focus();
    };
    return button;
  }

  private actionsFor(block: MiraMarkdownBlockRange): MiraBlockAction[] {
    return [
      ...builtInBlockActions(this.view, this.blocks, block),
      ...(this.options.blockActions ?? []),
    ];
  }

  private actionContext(block: MiraMarkdownBlockRange): MiraBlockActionContext {
    const selection = this.view.state.selection.main;
    const range = selection.empty
      ? null
      : { from: selection.from, to: selection.to };
    const blocks = selectedBlocks(this.view, this.blocks, block);

    return {
      view: this.view,
      block,
      blocks,
      selection: range,
      sourcePath: this.options.sourcePath,
      focus: () => this.view.focus(),
      getValue: () => this.view.state.doc.toString(),
      insertMarkdown: (markdown, selection) =>
        replaceMarkdownRange(
          this.view,
          markdown,
          {
            from: this.view.state.selection.main.from,
            to: this.view.state.selection.main.to,
          },
          selection,
        ),
      replaceRange: (markdown, range, selection) =>
        replaceMarkdownRange(this.view, markdown, range, selection),
      setValue: (value) => {
        this.view.dispatch({
          changes: { from: 0, to: this.view.state.doc.length, insert: value },
        });
      },
    };
  }

  private closeMenu(): void {
    this.menu.hidden = true;
    this.menu.replaceChildren();
  }

  private readonly handleDocumentPointerDown = (event: PointerEvent): void => {
    const target = event.target instanceof Node ? event.target : null;
    if (!target || this.menu.hidden || this.layer.contains(target)) {
      return;
    }
    this.closeMenu();
  };

  private readonly handleDocumentKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      this.closeMenu();
    }
  };
}

function builtInBlockActions(
  view: EditorView,
  allBlocks: MiraMarkdownBlockRange[],
  block: MiraMarkdownBlockRange,
): MiraBlockAction[] {
  return [
    {
      id: "mira-block-move-up",
      label: "Move up",
      disabled: ({ blocks }) => {
        const first = blocks[0] ?? block;
        return (
          allBlocks.findIndex((candidate) => candidate.id === first.id) <= 0
        );
      },
      run: ({ blocks }) => {
        const sourceBlocks = blocks.length > 0 ? blocks : [block];
        const firstIndex = allBlocks.findIndex(
          (candidate) => candidate.id === sourceBlocks[0]!.id,
        );
        const target = allBlocks[firstIndex - 1];
        if (target) {
          moveMarkdownBlockRange(view, compositeBlock(view, sourceBlocks), {
            block: target,
            position: "before",
          });
        }
      },
    },
    {
      id: "mira-block-move-down",
      label: "Move down",
      disabled: ({ blocks }) => {
        const last = blocks.at(-1) ?? block;
        return (
          allBlocks.findIndex((candidate) => candidate.id === last.id) >=
          allBlocks.length - 1
        );
      },
      run: ({ blocks }) => {
        const sourceBlocks = blocks.length > 0 ? blocks : [block];
        const lastIndex = allBlocks.findIndex(
          (candidate) => candidate.id === sourceBlocks.at(-1)!.id,
        );
        const target = allBlocks[lastIndex + 1];
        if (target) {
          moveMarkdownBlockRange(view, compositeBlock(view, sourceBlocks), {
            block: target,
            position: "after",
          });
        }
      },
    },
    {
      id: "mira-block-duplicate",
      label: "Duplicate",
      run: ({ blocks }) => {
        duplicateMarkdownBlockRange(
          view,
          compositeBlock(view, blocks.length > 0 ? blocks : [block]),
        );
      },
    },
    {
      id: "mira-block-delete",
      label: "Delete",
      destructive: true,
      run: ({ blocks }) => {
        deleteMarkdownBlockRange(
          view,
          compositeBlock(view, blocks.length > 0 ? blocks : [block]),
        );
      },
    },
  ];
}

function activeBlock(
  view: EditorView,
  blocks: MiraMarkdownBlockRange[],
): MiraMarkdownBlockRange | null {
  const head = view.state.selection.main.head;
  return (
    blocks.find(
      (block) =>
        head >= block.from &&
        head <= Math.min(block.to + 1, view.state.doc.length),
    ) ??
    blocks.find((block) => head < block.from) ??
    blocks.at(-1) ??
    null
  );
}

function selectedBlocks(
  view: EditorView,
  blocks: MiraMarkdownBlockRange[],
  fallback: MiraMarkdownBlockRange,
): MiraMarkdownBlockRange[] {
  const selection = view.state.selection.main;
  if (selection.empty) {
    return [fallback];
  }
  const selected = blocks.filter(
    (block) => selection.from <= block.to && selection.to >= block.from,
  );
  return selected.length > 0 ? selected : [fallback];
}

function compositeBlock(
  view: EditorView,
  blocks: MiraMarkdownBlockRange[],
): MiraMarkdownBlockRange {
  const sorted = [...blocks].sort((a, b) => a.from - b.from);
  const first = sorted[0]!;
  const last = sorted.at(-1)!;
  return {
    id: sorted.map((block) => block.id).join("+"),
    kind: first.kind,
    from: first.from,
    to: last.to,
    startLine: first.startLine,
    endLine: last.endLine,
    text: view.state.doc.sliceString(first.from, last.to),
  };
}

function dynamicDisabled(
  action: MiraBlockAction,
  context: MiraBlockActionContext,
): boolean {
  if (typeof action.disabled === "function") {
    return action.disabled(context);
  }
  return action.disabled ?? false;
}

const blockControlsTheme = EditorView.theme({
  "&": {
    position: "relative",
  },
  ".mira-block-controls-layer": {
    inset: "0",
    overflow: "visible",
    pointerEvents: "none",
    position: "absolute",
    zIndex: "30",
  },
  ".mira-block-handle": {
    alignItems: "center",
    background: "var(--mira-popover)",
    border: "1px solid var(--mira-border)",
    borderRadius: "4px",
    boxShadow: "var(--mira-widget-shadow)",
    color: "var(--mira-muted-foreground)",
    cursor: "grab",
    display: "inline-flex",
    height: "1.35rem",
    justifyContent: "center",
    insetInlineStart: "0.25rem",
    opacity: "0",
    padding: "0",
    pointerEvents: "auto",
    position: "absolute",
    transition: "opacity 120ms ease, color 120ms ease, background 120ms ease",
    width: "1.35rem",
  },
  ".mira-block-handle:hover, .mira-block-handle:focus-visible, &:focus-within .mira-block-handle":
    {
      opacity: "1",
    },
  ".mira-block-handle:active, &.mira-block-controls-dragging .mira-block-handle":
    {
      cursor: "grabbing",
    },
  ".mira-block-handle:hover, .mira-block-handle:focus-visible": {
    background: "var(--mira-accent-soft)",
    color: "var(--mira-foreground)",
    outline: "none",
  },
  ".mira-block-handle svg": {
    height: "1rem",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: "3",
    width: "1rem",
  },
  ".mira-block-drop-line": {
    background: "var(--mira-accent)",
    height: "2px",
    insetInline: "2.25rem 0.75rem",
    pointerEvents: "none",
    position: "absolute",
  },
  ".mira-block-menu": {
    background: "var(--mira-popover)",
    border: "1px solid var(--mira-border)",
    borderRadius: "var(--mira-radius)",
    boxShadow: "var(--mira-widget-shadow)",
    color: "var(--mira-popover-foreground)",
    display: "grid",
    fontFamily: "var(--mira-font-sans)",
    fontSize: "13px",
    minWidth: "9rem",
    padding: "4px",
    pointerEvents: "auto",
    position: "absolute",
  },
  ".mira-block-menu[hidden]": {
    display: "none",
  },
  ".mira-block-menu__item": {
    background: "transparent",
    border: "0",
    borderRadius: "4px",
    color: "inherit",
    cursor: "pointer",
    font: "inherit",
    padding: "7px 8px",
    textAlign: "left",
  },
  ".mira-block-menu__item:hover, .mira-block-menu__item:focus-visible": {
    background: "var(--mira-accent-soft)",
    outline: "none",
  },
  ".mira-block-menu__item:disabled": {
    cursor: "not-allowed",
    opacity: "0.5",
  },
  ".mira-block-menu__item--destructive": {
    color: "var(--mira-danger, #dc2626)",
  },
});
