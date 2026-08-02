import {
  Prec,
  StateEffect,
  StateField,
  type EditorState,
  type Extension,
  type Range,
} from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  GutterMarker,
  EditorView,
  gutter,
  keymap,
  type BlockInfo,
  type KeyBinding,
  type PluginValue,
  type ViewUpdate,
  ViewPlugin,
} from "@codemirror/view";
import type {
  MiraBlockAction,
  MiraBlockActionContext,
  MiraMarkdownBlockHandle,
  MiraMarkdownBlockRange,
} from "@mira-mde/extensions";
import type { MiraRichEditorOptions } from "./types";
import {
  collectMarkdownBlockHandles,
  deleteMarkdownBlockHandle,
  deleteMarkdownBlockRange,
  duplicateMarkdownBlockHandle,
  duplicateMarkdownBlockRange,
  moveMarkdownBlockHandle,
  moveMarkdownBlockRange,
  replaceMarkdownRange,
} from "./block-ranges";

type BlockRect = {
  handle: MiraMarkdownBlockHandle;
  top: number;
  bottom: number;
  affectedTop: number;
  affectedBottom: number;
};

type DragState = {
  handleId: string;
  dragging: boolean;
  startX: number;
  startY: number;
};

type DropTarget = {
  handle: MiraMarkdownBlockHandle;
  position: "before" | "after" | "inside";
  top: number;
};

type BlockHighlightState = {
  handleId: string | null;
  range: MiraMarkdownBlockRange | null;
  decorations: DecorationSet;
};

const dragActivationDistance = 5;
const listNestActivationDistance = 24;
const autoScrollThreshold = 42;
const autoScrollStep = 18;
const handleStartCache = new WeakMap<
  EditorState,
  Map<number, MiraMarkdownBlockHandle>
>();
const activeHandleIdsCache = new WeakMap<EditorState, Set<string>>();
const blockHandleSvg =
  '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01"/></svg>';

const setBlockHighlightEffect = StateEffect.define<{
  handleId: string;
  range: MiraMarkdownBlockRange;
} | null>();

const emptyBlockHighlightState: BlockHighlightState = {
  handleId: null,
  range: null,
  decorations: Decoration.none,
};

const blockHighlightStateField = StateField.define<BlockHighlightState>({
  create() {
    return emptyBlockHighlightState;
  },
  update(value, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(setBlockHighlightEffect)) {
        return effect.value
          ? {
              handleId: effect.value.handleId,
              range: effect.value.range,
              decorations: buildHighlightDecorations(
                transaction.state,
                effect.value.range,
              ),
            }
          : emptyBlockHighlightState;
      }
    }

    if (transaction.docChanged) {
      return emptyBlockHighlightState;
    }

    return value.decorations === Decoration.none
      ? value
      : { ...value, decorations: value.decorations.map(transaction.changes) };
  },
  provide: (field) =>
    EditorView.decorations.from(field, (value) => value.decorations),
});

export function blockControlExtensions(
  options: MiraRichEditorOptions,
): Extension[] {
  if (options.blockControls !== true) {
    return [];
  }

  return [
    blockControlsTheme,
    blockHighlightStateField,
    blockHandleGutter(),
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

function blockHandleGutter(): Extension {
  return gutter({
    class: "mira-block-controls-gutter",
    initialSpacer: () => blockHandleSpacerMarker,
    lineMarker(view, line) {
      const handle = handleForVisualLine(view, line);
      const selectedHandleId = blockHighlight(view.state).handleId;
      const active = handle
        ? activeHandleIdsForState(view.state).has(handle.id)
        : false;
      const selected = handle ? handle.id === selectedHandleId : false;
      return handle ? new BlockHandleMarker(handle, active, selected) : null;
    },
    lineMarkerChange(update) {
      return (
        update.docChanged ||
        update.selectionSet ||
        update.viewportChanged ||
        update.transactions.some((transaction) =>
          transaction.effects.some((effect) =>
            effect.is(setBlockHighlightEffect),
          ),
        )
      );
    },
    renderEmptyElements: true,
  });
}

function handleForVisualLine(
  view: EditorView,
  line: BlockInfo,
): MiraMarkdownBlockHandle | null {
  return handleStartsForState(view.state).get(line.from) ?? null;
}

function handleStartsForState(
  state: EditorState,
): Map<number, MiraMarkdownBlockHandle> {
  const cached = handleStartCache.get(state);
  if (cached) {
    return cached;
  }

  const starts = new Map<number, MiraMarkdownBlockHandle>();
  for (const handle of collectMarkdownBlockHandles(state)) {
    starts.set(handle.handleRange.from, handle);
  }
  handleStartCache.set(state, starts);
  return starts;
}

function activeHandleIdsForState(state: EditorState): Set<string> {
  const cached = activeHandleIdsCache.get(state);
  if (cached) {
    return cached;
  }

  const handles = [...handleStartsForState(state).values()].sort(
    (a, b) => a.handleRange.from - b.handleRange.from,
  );
  const selection = state.selection.main;
  const ids = new Set<string>();

  if (selection.empty) {
    const handle = handleAtPosition(state, handles, selection.head);
    if (handle) {
      ids.add(handle.id);
    }
  } else {
    for (const handle of handles) {
      if (
        selection.from <= handle.handleRange.to &&
        selection.to >= handle.handleRange.from
      ) {
        ids.add(handle.id);
      }
    }
  }

  activeHandleIdsCache.set(state, ids);
  return ids;
}

function handleAtPosition(
  state: EditorState,
  handles: MiraMarkdownBlockHandle[],
  position: number,
): MiraMarkdownBlockHandle | null {
  const containing = handles
    .filter(
      (handle) =>
        position >= handle.affectedRange.from &&
        position <= Math.min(handle.affectedRange.to + 1, state.doc.length),
    )
    .sort(
      (a, b) =>
        a.affectedRange.to -
        a.affectedRange.from -
        (b.affectedRange.to - b.affectedRange.from),
    );

  return (
    containing[0] ??
    handles.find((handle) => position < handle.handleRange.from) ??
    handles.at(-1) ??
    null
  );
}

function blockHighlight(state: EditorState): BlockHighlightState {
  return (
    state.field(blockHighlightStateField, false) ?? emptyBlockHighlightState
  );
}

class BlockHandleMarker extends GutterMarker {
  override elementClass = "mira-block-controls-gutter__element";

  constructor(
    private readonly handle: MiraMarkdownBlockHandle,
    private readonly active: boolean,
    private readonly selected: boolean,
  ) {
    super();
  }

  override eq(other: GutterMarker): boolean {
    return (
      other instanceof BlockHandleMarker &&
      other.handle.id === this.handle.id &&
      other.handle.handleRange.from === this.handle.handleRange.from &&
      other.handle.handleRange.to === this.handle.handleRange.to &&
      other.active === this.active &&
      other.selected === this.selected
    );
  }

  override toDOM(): Node {
    const button = document.createElement("button");
    button.type = "button";
    button.className = [
      "mira-block-handle",
      this.active ? "mira-block-handle--active" : "",
      this.selected ? "mira-block-handle--selected" : "",
    ]
      .filter(Boolean)
      .join(" ");
    button.dataset.miraBlockId = this.handle.id;
    button.dataset.miraBlockRole = this.handle.role;
    button.setAttribute("aria-label", "Block drag handle");
    button.setAttribute(
      "title",
      "Drag to move. Click to highlight. Right-click for block actions.",
    );
    button.innerHTML = blockHandleSvg;
    return button;
  }
}

const blockHandleSpacerMarker = new (class extends GutterMarker {
  override elementClass = "mira-block-controls-gutter__element";

  override eq(other: GutterMarker): boolean {
    return other === this;
  }

  override toDOM(): Node {
    const spacer = document.createElement("span");
    spacer.className = "mira-block-handle-spacer";
    return spacer;
  }
})();

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
  const handles = collectMarkdownBlockHandles(view.state);
  const active = activeHandle(view, handles);
  if (!active) {
    return false;
  }

  const selectionHandles = selectedHandles(view, handles, active);
  const firstIndex = handles.findIndex(
    (handle) => handle.id === selectionHandles[0]?.id,
  );
  const lastIndex = handles.findIndex(
    (handle) => handle.id === selectionHandles.at(-1)?.id,
  );
  const target =
    direction < 0 ? handles[firstIndex - 1] : handles[lastIndex + 1];

  if (!target) {
    return false;
  }

  if (selectionHandles.length === 1) {
    return moveMarkdownBlockHandle(view, selectionHandles[0]!, {
      handle: target,
      position: direction < 0 ? "before" : "after",
    });
  }

  return moveMarkdownBlockRange(
    view,
    compositeHandleRange(view, selectionHandles),
    {
      block: target.affectedRange,
      position: direction < 0 ? "before" : "after",
    },
  );
}

class BlockControlsPlugin implements PluginValue {
  private readonly layer = document.createElement("div");
  private readonly dropLine = document.createElement("div");
  private readonly menu = document.createElement("div");
  private handles: MiraMarkdownBlockHandle[] = [];
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

    this.view.dom.addEventListener("pointerdown", this.handleHandlePointerDown);
    this.view.dom.addEventListener("click", this.handleHandleClick);
    this.view.dom.addEventListener("contextmenu", this.handleHandleContextMenu);
    this.view.dom.addEventListener("keydown", this.handleHandleKeyDown);
    this.view.scrollDOM.addEventListener("scroll", this.scheduleRender);
    window.addEventListener("resize", this.scheduleRender);
    document.addEventListener("pointerdown", this.handleDocumentPointerDown, {
      capture: true,
    });
    document.addEventListener("keydown", this.handleDocumentKeyDown);

    this.scheduleRender();
  }

  update(update: ViewUpdate): void {
    if (update.docChanged) {
      this.closeMenu();
      this.scheduleRender();
      return;
    }

    if (
      update.selectionSet ||
      update.viewportChanged ||
      update.geometryChanged
    ) {
      this.closeMenu();
      this.scheduleRender();
    }
  }

  destroy(): void {
    this.view.dom.removeEventListener(
      "pointerdown",
      this.handleHandlePointerDown,
    );
    this.view.dom.removeEventListener("click", this.handleHandleClick);
    this.view.dom.removeEventListener(
      "contextmenu",
      this.handleHandleContextMenu,
    );
    this.view.dom.removeEventListener("keydown", this.handleHandleKeyDown);
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
    this.handles = collectMarkdownBlockHandles(this.view.state);
    this.blockRects = [];
    const rootRect = this.view.dom.getBoundingClientRect();
    const fragment = document.createDocumentFragment();
    fragment.append(this.dropLine, this.menu);

    for (const handle of this.handles) {
      const rect = this.measureHandle(handle, rootRect);
      if (!rect) {
        continue;
      }
      this.blockRects.push({
        handle,
        top: rect.top,
        bottom: rect.bottom,
        affectedTop: rect.affectedTop,
        affectedBottom: rect.affectedBottom,
      });
    }

    this.layer.replaceChildren(fragment);
    if (this.dropTarget) {
      this.showDropLine(this.dropTarget.top);
    } else {
      this.hideDropLine();
    }
  }

  private measureHandle(
    handle: MiraMarkdownBlockHandle,
    rootRect: DOMRect,
  ): {
    top: number;
    bottom: number;
    affectedTop: number;
    affectedBottom: number;
  } | null {
    const start = this.view.coordsAtPos(handle.handleRange.from);
    const end = this.view.coordsAtPos(handle.handleRange.to);
    if (!start && !end) {
      return null;
    }

    const top = (start?.top ?? end!.top) - rootRect.top;
    const bottom = Math.max(
      (end?.bottom ?? start!.bottom) - rootRect.top,
      top + 18,
    );
    const affectedStart =
      this.view.coordsAtPos(handle.affectedRange.from) ?? start ?? end!;
    const affectedEnd =
      this.view.coordsAtPos(handle.affectedRange.to) ?? end ?? start!;
    const affectedTop = affectedStart.top - rootRect.top;
    const affectedBottom = Math.max(
      affectedEnd.bottom - rootRect.top,
      affectedTop + 18,
    );

    return { top, bottom, affectedTop, affectedBottom };
  }

  private readonly handleHandlePointerDown = (event: PointerEvent): void => {
    const handle = closestBlockHandle(event.target);
    const target = handle ? this.handleForButton(handle) : null;
    if (handle && target) {
      this.handlePointerDown(event, target);
    }
  };

  private readonly handleHandleClick = (event: MouseEvent): void => {
    const handle = closestBlockHandle(event.target);
    const target = handle ? this.handleForButton(handle) : null;
    if (!handle || !target) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    if (this.suppressNextClick) {
      this.suppressNextClick = false;
      return;
    }
    this.highlightHandle(target);
  };

  private readonly handleHandleContextMenu = (event: MouseEvent): void => {
    const button = closestBlockHandle(event.target);
    const handle = button ? this.handleForButton(button) : null;
    if (!button || !handle) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.highlightHandle(handle);
    this.openMenu(handle, button);
  };

  private readonly handleHandleKeyDown = (event: KeyboardEvent): void => {
    const button = closestBlockHandle(event.target);
    const handle = button ? this.handleForButton(button) : null;
    if (!button || !handle) {
      return;
    }

    if (
      event.key === "ContextMenu" ||
      (event.shiftKey && event.key === "F10")
    ) {
      event.preventDefault();
      event.stopPropagation();
      this.highlightHandle(handle);
      this.openMenu(handle, button);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      this.highlightHandle(handle);
    }
  };

  private handleForButton(
    button: HTMLButtonElement,
  ): MiraMarkdownBlockHandle | null {
    const handleId = button.dataset.miraBlockId;
    if (!handleId) {
      return null;
    }

    const handle =
      this.handles.find((candidate) => candidate.id === handleId) ??
      collectMarkdownBlockHandles(this.view.state).find(
        (candidate) => candidate.id === handleId,
      );

    return handle ?? null;
  }

  private handlePointerDown(
    event: PointerEvent,
    handle: MiraMarkdownBlockHandle,
  ): void {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.closeMenu();
    this.dragState = {
      handleId: handle.id,
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
    this.clearHighlight();
    this.view.dom.classList.add("mira-block-controls-dragging");
    this.dropTarget = this.resolveDropTarget(event);
    if (this.dropTarget) {
      this.showDropLine(this.dropTarget.top);
    }
    this.autoScroll(event.clientY);
  };

  private readonly handlePointerUp = (): void => {
    const dragState = this.dragState;
    const source = dragState
      ? this.handles.find((handle) => handle.id === dragState.handleId)
      : undefined;

    if (dragState?.dragging && source && this.dropTarget) {
      const selectionHandles = selectedHandles(this.view, this.handles, source);
      if (selectionHandles.length === 1) {
        moveMarkdownBlockHandle(this.view, source, {
          handle: this.dropTarget.handle,
          position: this.dropTarget.position,
        });
      } else if (this.dropTarget.position !== "inside") {
        moveMarkdownBlockRange(
          this.view,
          compositeHandleRange(this.view, selectionHandles),
          {
            block: this.dropTarget.handle.affectedRange,
            position: this.dropTarget.position,
          },
        );
      }
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

  private resolveDropTarget(event: PointerEvent): DropTarget | null {
    const source = this.dragState
      ? this.handles.find((handle) => handle.id === this.dragState?.handleId)
      : null;
    const sourceId = source?.id;
    const candidates = this.blockRects.filter(
      (rect) =>
        rect.handle.id !== sourceId &&
        (!source ||
          rect.handle.affectedRange.from < source.affectedRange.from ||
          rect.handle.affectedRange.to > source.affectedRange.to),
    );
    if (candidates.length === 0) {
      return null;
    }

    const rootTop = this.view.dom.getBoundingClientRect().top;
    const localY = event.clientY - rootTop;
    let nearest = candidates[0]!;
    let nearestDistance = Number.POSITIVE_INFINITY;
    let position: "before" | "after" | "inside" = "before";

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

    if (
      source?.role === "list-item" &&
      nearest.handle.role === "list-item" &&
      event.clientX - this.dragState!.startX >= listNestActivationDistance
    ) {
      position = "inside";
    }

    return {
      handle: nearest.handle,
      position,
      top: position === "before" ? nearest.affectedTop : nearest.affectedBottom,
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
    handle: MiraMarkdownBlockHandle,
    button: HTMLButtonElement,
  ): void {
    const actions = this.actionsFor(handle);
    const rect = button.getBoundingClientRect();
    const rootRect = this.view.dom.getBoundingClientRect();
    this.menu.replaceChildren(
      ...actions.map((action) => this.createMenuItem(action, handle)),
    );
    this.menu.hidden = false;
    this.menu.style.top = `${rect.top - rootRect.top}px`;
    this.menu.style.left = `${rect.right - rootRect.left + 6}px`;
    this.menu.querySelector<HTMLButtonElement>("button")?.focus();
  }

  private createMenuItem(
    action: MiraBlockAction,
    handle: MiraMarkdownBlockHandle,
  ): HTMLButtonElement {
    const context = this.actionContext(handle);
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

  private actionsFor(handle: MiraMarkdownBlockHandle): MiraBlockAction[] {
    return [
      ...builtInBlockActions(this.view, this.handles, handle),
      ...(this.options.blockActions ?? []),
    ];
  }

  private actionContext(
    handle: MiraMarkdownBlockHandle,
  ): MiraBlockActionContext {
    const selection = this.view.state.selection.main;
    const range = selection.empty
      ? null
      : { from: selection.from, to: selection.to };
    const handles = selectedHandles(this.view, this.handles, handle);
    const blocks = handles.map((target) => target.affectedRange);

    return {
      view: this.view,
      block: handle.affectedRange,
      blocks,
      handle,
      affectedRange: handle.affectedRange,
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

  private highlightHandle(handle: MiraMarkdownBlockHandle): void {
    this.view.dispatch({
      effects: setBlockHighlightEffect.of({
        handleId: handle.id,
        range: handle.affectedRange,
      }),
    });
    this.scheduleRender();
  }

  private clearHighlight(): void {
    if (!blockHighlight(this.view.state).handleId) {
      return;
    }
    this.view.dispatch({ effects: setBlockHighlightEffect.of(null) });
    this.scheduleRender();
  }

  private readonly handleDocumentPointerDown = (event: PointerEvent): void => {
    const target = event.target instanceof Node ? event.target : null;
    if (!target) {
      return;
    }

    if (!this.menu.hidden && !this.menu.contains(target)) {
      this.closeMenu();
    }

    if (!closestBlockHandle(target) && !this.menu.contains(target)) {
      this.clearHighlight();
    }
  };

  private readonly handleDocumentKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      this.closeMenu();
      this.clearHighlight();
    }
  };
}

function builtInBlockActions(
  view: EditorView,
  allHandles: MiraMarkdownBlockHandle[],
  handle: MiraMarkdownBlockHandle,
): MiraBlockAction[] {
  return [
    {
      id: "mira-block-move-up",
      label: "Move up",
      disabled: ({ blocks }) => {
        const first = blocks[0] ?? handle.affectedRange;
        return (
          allHandles.findIndex(
            (candidate) => candidate.affectedRange.id === first.id,
          ) <= 0
        );
      },
      run: ({ blocks }) => {
        const sourceHandles = handlesForAction(allHandles, blocks, handle);
        const firstIndex = allHandles.findIndex(
          (candidate) => candidate.id === sourceHandles[0]!.id,
        );
        const target = allHandles[firstIndex - 1];
        if (target) {
          if (sourceHandles.length === 1) {
            moveMarkdownBlockHandle(view, sourceHandles[0]!, {
              handle: target,
              position: "before",
            });
          } else {
            moveMarkdownBlockRange(
              view,
              compositeHandleRange(view, sourceHandles),
              {
                block: target.affectedRange,
                position: "before",
              },
            );
          }
        }
      },
    },
    {
      id: "mira-block-move-down",
      label: "Move down",
      disabled: ({ blocks }) => {
        const last = blocks.at(-1) ?? handle.affectedRange;
        return (
          allHandles.findIndex(
            (candidate) => candidate.affectedRange.id === last.id,
          ) >=
          allHandles.length - 1
        );
      },
      run: ({ blocks }) => {
        const sourceHandles = handlesForAction(allHandles, blocks, handle);
        const lastIndex = allHandles.findIndex(
          (candidate) => candidate.id === sourceHandles.at(-1)!.id,
        );
        const target = allHandles[lastIndex + 1];
        if (target) {
          if (sourceHandles.length === 1) {
            moveMarkdownBlockHandle(view, sourceHandles[0]!, {
              handle: target,
              position: "after",
            });
          } else {
            moveMarkdownBlockRange(
              view,
              compositeHandleRange(view, sourceHandles),
              {
                block: target.affectedRange,
                position: "after",
              },
            );
          }
        }
      },
    },
    {
      id: "mira-block-duplicate",
      label: "Duplicate",
      run: ({ blocks }) => {
        const sourceHandles = handlesForAction(allHandles, blocks, handle);
        if (sourceHandles.length === 1) {
          duplicateMarkdownBlockHandle(view, sourceHandles[0]!);
        } else {
          duplicateMarkdownBlockRange(
            view,
            compositeHandleRange(view, sourceHandles),
          );
        }
      },
    },
    {
      id: "mira-block-delete",
      label: "Delete",
      destructive: true,
      run: ({ blocks }) => {
        const sourceHandles = handlesForAction(allHandles, blocks, handle);
        if (sourceHandles.length === 1) {
          deleteMarkdownBlockHandle(view, sourceHandles[0]!);
        } else {
          deleteMarkdownBlockRange(
            view,
            compositeHandleRange(view, sourceHandles),
          );
        }
      },
    },
  ];
}

function activeHandle(
  view: EditorView,
  handles: MiraMarkdownBlockHandle[],
): MiraMarkdownBlockHandle | null {
  return handleAtPosition(view.state, handles, view.state.selection.main.head);
}

function selectedHandles(
  view: EditorView,
  handles: MiraMarkdownBlockHandle[],
  fallback: MiraMarkdownBlockHandle,
): MiraMarkdownBlockHandle[] {
  const selection = view.state.selection.main;
  if (selection.empty) {
    return [fallback];
  }
  const selected = handles.filter(
    (handle) =>
      selection.from <= handle.handleRange.to &&
      selection.to >= handle.handleRange.from,
  );
  return selected.length > 0 ? selected : [fallback];
}

function handlesForAction(
  allHandles: MiraMarkdownBlockHandle[],
  blocks: MiraMarkdownBlockRange[],
  fallback: MiraMarkdownBlockHandle,
): MiraMarkdownBlockHandle[] {
  if (blocks.length === 0) {
    return [fallback];
  }

  const handles = blocks
    .map((block) =>
      allHandles.find((handle) => handle.affectedRange.id === block.id),
    )
    .filter((handle): handle is MiraMarkdownBlockHandle => Boolean(handle));
  return handles.length > 0 ? handles : [fallback];
}

function compositeHandleRange(
  view: EditorView,
  handles: MiraMarkdownBlockHandle[],
): MiraMarkdownBlockRange {
  const sorted = [...handles]
    .map((handle) => handle.affectedRange)
    .sort((a, b) => a.from - b.from);
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

function closestBlockHandle(
  target: EventTarget | null,
): HTMLButtonElement | null {
  return target instanceof Element
    ? target.closest<HTMLButtonElement>(".mira-block-handle")
    : null;
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

function buildHighlightDecorations(
  state: EditorState,
  range: MiraMarkdownBlockRange,
): DecorationSet {
  const decorations: Array<Range<Decoration>> = [];
  const fromLine = state.doc.lineAt(range.from);
  const toLine = state.doc.lineAt(Math.max(range.from, range.to));

  for (
    let lineNumber = fromLine.number;
    lineNumber <= toLine.number;
    lineNumber += 1
  ) {
    decorations.push(
      Decoration.line({ class: "mira-block-affected-line" }).range(
        state.doc.line(lineNumber).from,
      ),
    );
  }

  return Decoration.set(decorations);
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
  ".cm-gutter.mira-block-controls-gutter": {
    background: "transparent",
    borderInlineEnd: "0",
    minWidth: "1.25rem",
    width: "1.25rem",
  },
  ".mira-block-controls-gutter .cm-gutterElement": {
    // Match line-number gutters: keep the grip on the first visual line
    // when a markdown block wraps to multiple lines.
    alignItems: "flex-start",
    display: "flex",
    justifyContent: "center",
    minWidth: "1.25rem",
    padding: "0",
  },
  ".mira-block-handle-spacer": {
    display: "block",
    height: "1rem",
    width: "1rem",
  },
  ".mira-block-handle": {
    alignItems: "center",
    appearance: "none",
    background: "transparent",
    border: "0",
    borderRadius: "0",
    boxShadow: "none",
    color: "var(--mira-muted-foreground)",
    cursor: "grab",
    display: "inline-flex",
    height: "1rem",
    justifyContent: "center",
    opacity: "0",
    padding: "0",
    pointerEvents: "auto",
    position: "relative",
    transition: "opacity 120ms ease, color 120ms ease",
    width: "1rem",
  },
  ".mira-block-controls-gutter:hover .mira-block-handle, .mira-block-handle--active, .mira-block-handle--selected, .mira-block-handle:hover, .mira-block-handle:focus-visible":
    {
      opacity: "1",
    },
  ".mira-block-handle:active, &.mira-block-controls-dragging .mira-block-handle":
    {
      cursor: "grabbing",
    },
  ".mira-block-handle:hover, .mira-block-handle:focus-visible": {
    color: "var(--mira-foreground)",
    outline: "none",
  },
  ".mira-block-handle--selected": {
    color: "var(--mira-accent)",
  },
  ".mira-block-handle svg": {
    display: "block",
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
  ".mira-block-affected-line": {
    backgroundColor: "color-mix(in srgb, var(--mira-accent) 12%, transparent)",
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
