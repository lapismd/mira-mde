import {
  EditorState,
  Prec,
  StateEffect,
  StateField,
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
  MiraToolbarIconName,
} from "@lapismd/mira/extensions";
import type { MiraRichEditorOptions } from "./types";
import {
  applyBlockToolbarItem,
  blockPresentation,
  canApplyBlockToolbarItem,
  createBlockToolbarIcon,
  resolveMiraBlockControlsOptions,
  type ResolvedMiraBlockToolbarConfig,
} from "./block-toolbar";
import type { MiraBlockToolbarItemId } from "@lapismd/mira/extensions";
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

type BlockToolbarMenuItem = {
  disabled: boolean;
  group: string;
  icon: Parameters<typeof createBlockToolbarIcon>[1];
  id: string;
  label: string;
  selected: boolean;
  shortcut?: string;
  type?: MiraBlockToolbarItemId;
  renderIcon?: (target: HTMLElement) => void | (() => void);
  run: () => void | Promise<void>;
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
  const resolvedBlockControls = resolveMiraBlockControlsOptions(
    options.blockControls,
  );
  if (!resolvedBlockControls.enabled) {
    return [];
  }

  return [
    blockControlsTheme,
    resolvedBlockControls.toolbar
      ? EditorView.editorAttributes.of({
          class: "mira-block-toolbar-enabled",
        })
      : [],
    blockHighlightStateField,
    blockHandleGutter(Boolean(resolvedBlockControls.toolbar)),
    Prec.highest(keymap.of(blockControlKeymap())),
    ViewPlugin.fromClass(
      class extends BlockControlsPlugin {
        constructor(view: EditorView) {
          super(view, options, resolvedBlockControls.toolbar);
        }
      },
    ),
  ];
}

function blockHandleGutter(toolbarEnabled: boolean): Extension {
  return gutter({
    class: "mira-block-controls-gutter",
    initialSpacer: () => blockHandleSpacerMarker,
    lineMarker(view, line) {
      const handle = handleForVisualLine(view, line);
      const selectedHandleId = blockHighlight(view.state).handleId;
      const activeHandleIds = activeHandleIdsForState(view.state);
      const active = handle ? activeHandleIds.has(handle.id) : false;
      const selected = handle ? handle.id === selectedHandleId : false;
      return handle
        ? new BlockHandleMarker(
            handle,
            active,
            selected,
            toolbarEnabled &&
              activeHandleIds.size <= 1 &&
              !view.state.facet(EditorState.readOnly),
          )
        : null;
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
    private readonly toolbarVisible: boolean,
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
      other.selected === this.selected &&
      other.toolbarVisible === this.toolbarVisible
    );
  }

  override toDOM(): Node {
    const row = document.createElement("span");
    row.className = "mira-block-controls-row";
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
    row.append(button);

    if (this.toolbarVisible) {
      const presentation = blockPresentation(this.handle);
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = [
        "mira-block-toolbar-trigger",
        this.active ? "mira-block-toolbar-trigger--active" : "",
        this.selected ? "mira-block-toolbar-trigger--selected" : "",
      ]
        .filter(Boolean)
        .join(" ");
      trigger.dataset.miraBlockId = this.handle.id;
      trigger.dataset.miraBlockType = presentation.type ?? "rich";
      trigger.setAttribute("aria-haspopup", "menu");
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-label", `Change ${presentation.label}`);
      trigger.setAttribute("title", `Change ${presentation.label}`);
      trigger.append(createBlockToolbarIcon(document, presentation.icon));
      row.append(trigger);
    }

    return row;
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
  private readonly toolbarPortal = document.createElement("div");
  private readonly toolbarMenu = document.createElement("div");
  private handles: MiraMarkdownBlockHandle[] = [];
  private blockRects: BlockRect[] = [];
  private dragState: DragState | null = null;
  private dropTarget: DropTarget | null = null;
  private renderFrame: number | null = null;
  private suppressNextClick = false;
  private toolbarHandleId: string | null = null;
  private toolbarIconCleanups: Array<() => void> = [];
  private toolbarTrigger: HTMLButtonElement | null = null;

  constructor(
    private readonly view: EditorView,
    private readonly options: MiraRichEditorOptions,
    private readonly toolbarConfig: ResolvedMiraBlockToolbarConfig | null,
  ) {
    this.layer.className = "mira-block-controls-layer";
    this.dropLine.className = "mira-block-drop-line";
    this.menu.className = "mira-block-menu";
    this.menu.setAttribute("role", "menu");
    this.menu.hidden = true;
    this.toolbarMenu.className = "mira-block-toolbar-menu";
    this.toolbarMenu.setAttribute("role", "menu");
    this.toolbarMenu.setAttribute(
      "aria-label",
      this.toolbarConfig?.ariaLabel ?? "Change block type",
    );
    this.toolbarMenu.setAttribute("data-mira-overlay", "");
    this.toolbarMenu.hidden = true;
    this.toolbarMenu.addEventListener("keydown", this.handleToolbarMenuKeyDown);
    this.layer.append(this.dropLine, this.menu);
    this.view.dom.append(this.layer);
    this.mountToolbarPortal();

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
      this.closeToolbarMenu();
      this.scheduleRender();
      return;
    }

    if (
      update.selectionSet ||
      update.viewportChanged ||
      update.geometryChanged
    ) {
      this.closeMenu();
      if (update.selectionSet) {
        this.closeToolbarMenu();
      }
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
    this.toolbarMenu.removeEventListener(
      "keydown",
      this.handleToolbarMenuKeyDown,
    );
    if (this.renderFrame !== null) {
      cancelAnimationFrame(this.renderFrame);
    }
    this.toolbarPortal.remove();
    this.layer.remove();
  }

  private mountToolbarPortal(): void {
    const ownerDocument = this.view.dom.ownerDocument;
    this.syncToolbarPortalAppearance();
    this.toolbarPortal.style.inset = "0";
    this.toolbarPortal.style.pointerEvents = "none";
    this.toolbarPortal.style.position = "fixed";
    this.toolbarPortal.style.zIndex = "1000";
    this.toolbarPortal.append(this.toolbarMenu);
    ownerDocument.body.append(this.toolbarPortal);
  }

  private syncToolbarPortalAppearance(): void {
    const themeHost = this.view.dom.closest<HTMLElement>("[data-mira-theme]");
    const modeHost = this.view.dom.closest<HTMLElement>(
      "[data-mira-color-mode]",
    );
    const colorHost = this.view.dom.closest<HTMLElement>(".light, .dark");
    this.toolbarPortal.className = [
      "mira mira-block-toolbar-portal",
      ...this.view.dom.classList,
      ...(colorHost
        ? Array.from(colorHost.classList).filter(
            (className) => className === "light" || className === "dark",
          )
        : []),
    ].join(" ");
    const theme = themeHost?.getAttribute("data-mira-theme");
    const mode = modeHost?.getAttribute("data-mira-color-mode");
    if (theme) {
      this.toolbarPortal.setAttribute("data-mira-theme", theme);
    } else {
      this.toolbarPortal.removeAttribute("data-mira-theme");
    }
    if (mode) {
      this.toolbarPortal.setAttribute("data-mira-color-mode", mode);
    } else {
      this.toolbarPortal.removeAttribute("data-mira-color-mode");
    }
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
    this.syncToolbarPortalAppearance();
    this.handles = collectMarkdownBlockHandles(this.view.state);
    this.blockRects = [];
    const rootRect = this.view.dom.getBoundingClientRect();

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

    if (this.dropTarget) {
      this.showDropLine(this.dropTarget.top);
    } else {
      this.hideDropLine();
    }
    this.refreshOpenToolbarTrigger();
  }

  private refreshOpenToolbarTrigger(): void {
    if (this.toolbarMenu.hidden || !this.toolbarHandleId) {
      return;
    }
    const trigger = Array.from(
      this.view.dom.querySelectorAll<HTMLButtonElement>(
        ".mira-block-toolbar-trigger",
      ),
    ).find(
      (candidate) => candidate.dataset.miraBlockId === this.toolbarHandleId,
    );
    if (!trigger) {
      this.closeToolbarMenu();
      return;
    }
    this.toolbarTrigger?.classList.remove("mira-block-toolbar-trigger--open");
    this.toolbarTrigger?.setAttribute("aria-expanded", "false");
    this.toolbarTrigger = trigger;
    trigger.classList.add("mira-block-toolbar-trigger--open");
    trigger.setAttribute("aria-expanded", "true");
    this.positionToolbarMenu(trigger);
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
    const toolbarTrigger = closestBlockToolbarTrigger(event.target);
    const toolbarHandle = toolbarTrigger
      ? this.handleForButton(toolbarTrigger)
      : null;
    if (toolbarTrigger && toolbarHandle) {
      event.preventDefault();
      event.stopPropagation();
      this.highlightHandle(toolbarHandle);
      this.openToolbarMenu(toolbarHandle, toolbarTrigger);
      return;
    }

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
    const toolbarTrigger = closestBlockToolbarTrigger(event.target);
    const toolbarHandle = toolbarTrigger
      ? this.handleForButton(toolbarTrigger)
      : null;
    if (toolbarTrigger && toolbarHandle) {
      if (
        event.key === "Enter" ||
        event.key === " " ||
        event.key === "ArrowDown"
      ) {
        event.preventDefault();
        event.stopPropagation();
        this.highlightHandle(toolbarHandle);
        this.openToolbarMenu(toolbarHandle, toolbarTrigger);
      }
      return;
    }

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

  private openToolbarMenu(
    handle: MiraMarkdownBlockHandle,
    trigger: HTMLButtonElement,
  ): void {
    if (!this.toolbarConfig) {
      return;
    }

    this.closeMenu();
    this.closeToolbarMenu();
    this.syncToolbarPortalAppearance();
    const items = this.toolbarItemsFor(handle);
    let previousGroup: string | null = null;
    const nodes: Node[] = [];
    for (const item of items) {
      if (previousGroup !== null && item.group !== previousGroup) {
        const separator = this.toolbarMenu.ownerDocument.createElement("div");
        separator.className = "mira-block-toolbar-menu__separator";
        separator.setAttribute("role", "separator");
        nodes.push(separator);
      }
      nodes.push(this.createToolbarMenuItem(item));
      previousGroup = item.group;
    }

    this.toolbarMenu.replaceChildren(...nodes);
    this.toolbarMenu.hidden = false;
    this.toolbarHandleId = handle.id;
    this.toolbarTrigger = trigger;
    trigger.classList.add("mira-block-toolbar-trigger--open");
    trigger.setAttribute("aria-expanded", "true");
    this.positionToolbarMenu(trigger);

    const selected = this.toolbarMenu.querySelector<HTMLButtonElement>(
      '.mira-block-toolbar-menu__item[data-selected="true"]:not(:disabled)',
    );
    const first = this.toolbarMenu.querySelector<HTMLButtonElement>(
      ".mira-block-toolbar-menu__item:not(:disabled)",
    );
    (selected ?? first)?.focus();
  }

  private toolbarItemsFor(
    handle: MiraMarkdownBlockHandle,
  ): BlockToolbarMenuItem[] {
    const current = blockPresentation(handle).type;
    const builtIns = (this.toolbarConfig?.items ?? []).map((type) => {
      const definition = blockToolbarItemDefinition(type);
      return {
        ...definition,
        id: `mira-block-toolbar-${type}`,
        type,
        selected: current === type,
        disabled:
          !canApplyBlockToolbarItem(handle, type) ||
          (type === "image" && !this.options.insertImage),
        run: () => {
          applyBlockToolbarItem(this.view, handle, type, {
            insertImage: this.options.insertImage
              ? () => this.options.insertImage?.(this.view)
              : undefined,
          });
        },
      };
    });
    const context = this.actionContext(handle);
    const custom = (this.options.blockActions ?? [])
      .filter((action) => action.placements?.includes("block-menu"))
      .map<BlockToolbarMenuItem>((action) => ({
        id: action.id,
        label: action.label,
        group: action.group ?? "extensions",
        icon: blockActionIcon(action.icon),
        shortcut: action.shortcut,
        renderIcon: action.renderIcon,
        selected: false,
        disabled: dynamicDisabled(action, context),
        run: () => action.run(context),
      }));
    return [...builtIns, ...custom];
  }

  private createToolbarMenuItem(item: BlockToolbarMenuItem): HTMLButtonElement {
    const button = this.toolbarMenu.ownerDocument.createElement("button");
    button.type = "button";
    button.className = "mira-block-toolbar-menu__item";
    button.dataset.blockToolbarItem = item.type ?? item.id;
    button.dataset.selected = item.selected ? "true" : "false";
    button.disabled = item.disabled;
    if (item.type && item.type !== "image") {
      button.setAttribute("role", "menuitemradio");
      button.setAttribute("aria-checked", String(item.selected));
    } else {
      button.setAttribute("role", "menuitem");
    }

    const icon = this.toolbarMenu.ownerDocument.createElement("span");
    icon.className = "mira-block-toolbar-menu__icon";
    const cleanup = item.renderIcon?.(icon);
    if (cleanup) {
      this.toolbarIconCleanups.push(cleanup);
    } else if (icon.childNodes.length === 0) {
      icon.append(
        createBlockToolbarIcon(this.toolbarMenu.ownerDocument, item.icon),
      );
    }
    const label = this.toolbarMenu.ownerDocument.createElement("span");
    label.className = "mira-block-toolbar-menu__label";
    label.textContent = item.label;
    button.append(icon, label);
    if (item.shortcut) {
      const shortcut = this.toolbarMenu.ownerDocument.createElement("kbd");
      shortcut.className = "mira-block-toolbar-menu__shortcut";
      shortcut.textContent = item.shortcut;
      button.append(shortcut);
    }

    button.onclick = () => {
      if (!item.disabled) {
        void item.run();
      }
      this.closeToolbarMenu();
      this.view.focus();
    };
    return button;
  }

  private positionToolbarMenu(trigger: HTMLButtonElement): void {
    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = this.toolbarMenu.getBoundingClientRect();
    const viewportWidth =
      this.toolbarMenu.ownerDocument.defaultView?.innerWidth ??
      triggerRect.right;
    const viewportHeight =
      this.toolbarMenu.ownerDocument.defaultView?.innerHeight ??
      triggerRect.bottom;
    const gap = 8;
    let left = triggerRect.right + gap;
    if (triggerRect.right + gap + menuRect.width > viewportWidth) {
      left = triggerRect.left - menuRect.width - gap;
    }
    const maxLeft = Math.max(gap, viewportWidth - menuRect.width - gap);
    const maxTop = Math.max(gap, viewportHeight - menuRect.height - gap);
    const top = Math.max(gap, Math.min(triggerRect.top, maxTop));
    this.toolbarMenu.style.left = `${Math.max(gap, Math.min(left, maxLeft))}px`;
    this.toolbarMenu.style.top = `${top}px`;
  }

  private readonly handleToolbarMenuKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      const trigger = this.toolbarTrigger;
      this.closeToolbarMenu();
      trigger?.focus();
      return;
    }
    if (event.key === "Tab") {
      this.closeToolbarMenu();
      return;
    }

    const buttons = Array.from(
      this.toolbarMenu.querySelectorAll<HTMLButtonElement>(
        ".mira-block-toolbar-menu__item:not(:disabled)",
      ),
    );
    const activeIndex = buttons.indexOf(
      this.toolbarMenu.ownerDocument.activeElement as HTMLButtonElement,
    );
    const nextIndex =
      event.key === "ArrowDown"
        ? (Math.max(0, activeIndex) + 1) % buttons.length
        : event.key === "ArrowUp"
          ? (activeIndex <= 0 ? buttons.length : activeIndex) - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? buttons.length - 1
              : null;
    if (nextIndex === null || buttons.length === 0) {
      return;
    }
    event.preventDefault();
    buttons[nextIndex]?.focus();
  };

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
      ...(this.options.blockActions ?? []).filter(
        (action) =>
          !action.placements || action.placements.includes("context-menu"),
      ),
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

  private closeToolbarMenu(): void {
    for (const cleanup of this.toolbarIconCleanups.splice(0)) {
      cleanup();
    }
    this.toolbarMenu.hidden = true;
    this.toolbarMenu.replaceChildren();
    this.toolbarHandleId = null;
    if (this.toolbarTrigger) {
      this.toolbarTrigger.classList.remove("mira-block-toolbar-trigger--open");
      this.toolbarTrigger.setAttribute("aria-expanded", "false");
      this.toolbarTrigger = null;
    }
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

    if (
      !this.toolbarMenu.hidden &&
      !this.toolbarMenu.contains(target) &&
      !closestBlockToolbarTrigger(target)
    ) {
      this.closeToolbarMenu();
    }

    if (
      !closestBlockHandle(target) &&
      !closestBlockToolbarTrigger(target) &&
      !this.menu.contains(target) &&
      !this.toolbarMenu.contains(target)
    ) {
      this.clearHighlight();
    }
  };

  private readonly handleDocumentKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      this.closeMenu();
      this.closeToolbarMenu();
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

function blockToolbarItemDefinition(
  type: MiraBlockToolbarItemId,
): Pick<BlockToolbarMenuItem, "group" | "icon" | "label" | "shortcut"> {
  switch (type) {
    case "task":
      return { group: "text", icon: "task", label: "Task" };
    case "paragraph":
      return { group: "text", icon: "paragraph", label: "Paragraph" };
    case "heading1":
      return {
        group: "headings",
        icon: "heading1",
        label: "Heading 1",
        shortcut: "⌥⌘1",
      };
    case "heading2":
      return {
        group: "headings",
        icon: "heading2",
        label: "Heading 2",
        shortcut: "⌥⌘2",
      };
    case "heading3":
      return {
        group: "headings",
        icon: "heading3",
        label: "Heading 3",
        shortcut: "⌥⌘3",
      };
    case "divider":
      return { group: "structure", icon: "divider", label: "Divider" };
    case "bulletList":
      return { group: "structure", icon: "bulletList", label: "Bullet list" };
    case "numberedList":
      return {
        group: "structure",
        icon: "numberedList",
        label: "Numbered list",
      };
    case "quote":
      return { group: "structure", icon: "quote", label: "Blockquote" };
    case "image":
      return { group: "insert", icon: "image", label: "Image" };
  }
}

function blockActionIcon(
  icon: MiraToolbarIconName | undefined,
): BlockToolbarMenuItem["icon"] {
  return icon === "check" ? "task" : (icon ?? "generic");
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

function closestBlockToolbarTrigger(
  target: EventTarget | null,
): HTMLButtonElement | null {
  return target instanceof Element
    ? target.closest<HTMLButtonElement>(".mira-block-toolbar-trigger")
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
  "&.mira-block-toolbar-enabled .cm-gutter.mira-block-controls-gutter": {
    minWidth: "2.375rem",
    overflow: "visible",
    width: "2.375rem",
  },
  "&.mira-block-toolbar-enabled .cm-gutters": {
    marginInlineEnd: "1.75rem",
  },
  ".mira-block-controls-gutter .cm-gutterElement": {
    // Stay on the first visual line when a block wraps (not mid-block).
    alignItems: "flex-start",
    display: "flex",
    justifyContent: "center",
    minWidth: "1.25rem",
    padding: "0",
  },
  "&.mira-block-toolbar-enabled .mira-block-controls-gutter .cm-gutterElement":
    {
      minWidth: "2.375rem",
      width: "2.375rem",
    },
  ".mira-block-controls-row": {
    alignItems: "center",
    display: "inline-flex",
    gap: "0.125rem",
    height: "1.25rem",
    justifyContent: "center",
    lineHeight: "inherit",
    marginTop: "max(0px, calc((1lh - 1.25rem) / 2))",
    width: "2.375rem",
  },
  ".mira-block-handle-spacer": {
    display: "block",
    height: "1rem",
    // Inherit gutter line-height so 1lh matches the first content line.
    lineHeight: "inherit",
    marginTop: "max(0px, calc((1lh - 1rem) / 2))",
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
    // Inherit gutter line-height so 1lh is the first-line box, not the
    // button's own metrics; then center the 1rem grip in that band.
    lineHeight: "inherit",
    marginTop: "max(0px, calc((1lh - 1rem) / 2))",
    opacity: "0",
    padding: "0",
    pointerEvents: "auto",
    position: "relative",
    transition: "opacity 120ms ease, color 120ms ease",
    width: "1rem",
  },
  ".mira-block-controls-row .mira-block-handle": {
    marginTop: "0",
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
  ".mira-block-toolbar-trigger": {
    alignItems: "center",
    appearance: "none",
    background: "var(--mira-accent-soft)",
    border: "1px solid transparent",
    borderRadius: "999px",
    boxShadow: "none",
    color: "var(--mira-muted-foreground)",
    cursor: "pointer",
    display: "inline-flex",
    flex: "0 0 1.25rem",
    height: "1.25rem",
    justifyContent: "center",
    lineHeight: "1",
    opacity: "0",
    padding: "0",
    pointerEvents: "none",
    transition:
      "background-color 120ms ease, border-color 120ms ease, color 120ms ease, opacity 120ms ease",
    width: "1.25rem",
  },
  ".mira-block-controls-gutter .cm-gutterElement:hover .mira-block-toolbar-trigger, .mira-block-toolbar-trigger--active, .mira-block-toolbar-trigger--selected, .mira-block-toolbar-trigger--open, .mira-block-toolbar-trigger:focus-visible":
    {
      opacity: "1",
      pointerEvents: "auto",
    },
  ".mira-block-toolbar-trigger:hover, .mira-block-toolbar-trigger:focus-visible, .mira-block-toolbar-trigger--open":
    {
      background: "var(--mira-accent-soft)",
      borderColor: "var(--mira-border)",
      color: "var(--mira-foreground)",
      outline: "none",
    },
  ".mira-block-toolbar-trigger:focus-visible": {
    borderColor: "var(--mira-focus-ring, var(--mira-accent))",
    boxShadow: "0 0 0 1px var(--mira-focus-ring, var(--mira-accent))",
  },
  ".mira-block-toolbar__icon-svg": {
    fill: "none",
    height: "0.75rem",
    pointerEvents: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: "2",
    width: "0.75rem",
  },
  ".mira-block-toolbar__icon-text": {
    fontFamily: "var(--mira-font-sans)",
    fontSize: "0.625rem",
    fontWeight: "650",
    letterSpacing: "-0.04em",
    pointerEvents: "none",
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
  ".mira-block-toolbar-menu": {
    background: "var(--mira-popover)",
    border: "1px solid var(--mira-border)",
    borderRadius: "calc(var(--mira-radius) * 2)",
    boxShadow: "var(--mira-widget-shadow)",
    color: "var(--mira-popover-foreground)",
    display: "grid",
    fontFamily: "var(--mira-font-sans)",
    fontSize: "14px",
    maxHeight: "min(32rem, calc(100vh - 1rem))",
    minWidth: "16rem",
    overflowY: "auto",
    padding: "0.375rem",
    pointerEvents: "auto",
    position: "fixed",
  },
  ".mira-block-toolbar-menu[hidden]": {
    display: "none",
  },
  ".mira-block-toolbar-menu__separator": {
    background: "var(--mira-border)",
    height: "1px",
    margin: "0.3rem 0.25rem",
  },
  ".mira-block-toolbar-menu__item": {
    alignItems: "center",
    appearance: "none",
    background: "transparent",
    border: "0",
    borderRadius: "calc(var(--mira-radius) * 0.75)",
    color: "inherit",
    cursor: "pointer",
    display: "grid",
    font: "inherit",
    gap: "0.625rem",
    gridTemplateColumns: "1.25rem minmax(0, 1fr) auto",
    minHeight: "2.25rem",
    padding: "0.4rem 0.5rem",
    textAlign: "left",
    width: "100%",
  },
  '.mira-block-toolbar-menu__item[data-selected="true"]': {
    background: "var(--mira-accent-soft)",
    color: "var(--mira-accent)",
  },
  ".mira-block-toolbar-menu__item:hover, .mira-block-toolbar-menu__item:focus-visible":
    {
      background: "var(--mira-accent-soft)",
      outline: "none",
    },
  ".mira-block-toolbar-menu__item:focus-visible": {
    boxShadow: "inset 0 0 0 1px var(--mira-focus-ring, var(--mira-accent))",
  },
  ".mira-block-toolbar-menu__item:disabled": {
    cursor: "not-allowed",
    opacity: "0.45",
  },
  ".mira-block-toolbar-menu__icon": {
    alignItems: "center",
    color: "var(--mira-muted-foreground)",
    display: "inline-flex",
    height: "1.25rem",
    justifyContent: "center",
    width: "1.25rem",
  },
  ".mira-block-toolbar-menu__label": {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  ".mira-block-toolbar-menu__shortcut": {
    background: "var(--mira-muted)",
    borderRadius: "999px",
    color: "var(--mira-muted-foreground)",
    font: "inherit",
    fontSize: "0.75rem",
    padding: "0.15rem 0.4rem",
  },
});
