import {
  EditorState,
  Prec,
  StateField,
  type Extension,
} from "@codemirror/state";
import {
  EditorView,
  keymap,
  showTooltip,
  type Tooltip,
  type TooltipView,
} from "@codemirror/view";
import {
  applyMiraMarkdownAction,
  type MiraMarkdownActionId,
} from "../../../core/markdown-actions";

export const miraSelectionToolbarActionIds = [
  "link",
  "bold",
  "italic",
  "strikethrough",
  "inlineCode",
] as const satisfies readonly MiraMarkdownActionId[];

export type MiraSelectionToolbarActionId =
  (typeof miraSelectionToolbarActionIds)[number];

export type MiraSelectionToolbarPlacement = "above" | "below";

export type MiraSelectionToolbarConfig = {
  /** Inline Markdown actions shown from left to right. */
  actions?: readonly MiraSelectionToolbarActionId[];
  /** Accessible name for the toolbar. */
  ariaLabel?: string;
  /** Per-action accessible labels and hover titles. */
  labels?: Partial<Record<MiraSelectionToolbarActionId, string>>;
  /** Preferred side of the selected text. Defaults to `below`. */
  placement?: MiraSelectionToolbarPlacement;
};

export const defaultMiraSelectionToolbarActions = [
  "link",
  "bold",
  "italic",
  "strikethrough",
] as const satisfies readonly MiraSelectionToolbarActionId[];

const defaultActionLabels: Record<MiraSelectionToolbarActionId, string> = {
  link: "Link",
  bold: "Bold",
  italic: "Italic",
  strikethrough: "Strikethrough",
  inlineCode: "Inline code",
};

type ResolvedSelectionToolbarConfig = {
  actions: readonly MiraSelectionToolbarActionId[];
  ariaLabel: string;
  labels: Record<MiraSelectionToolbarActionId, string>;
  placement: MiraSelectionToolbarPlacement;
};

const iconPaths: Record<MiraSelectionToolbarActionId, readonly string[]> = {
  link: [
    "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
    "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  ],
  bold: ["M6 12h9a4 4 0 0 1 0 8H6V4h8a4 4 0 0 1 0 8"],
  italic: ["M19 4h-9", "M14 20H5", "M15 4 9 20"],
  strikethrough: [
    "M16 4H9a3 3 0 0 0-2.83 4",
    "M14 12a4 4 0 0 1 0 8H6",
    "M4 12h16",
  ],
  inlineCode: ["m18 16 4-4-4-4", "m6 8-4 4 4 4", "m14.5 4-5 16"],
};

const selectionToolbarTheme = EditorView.baseTheme({
  ".cm-tooltip.mira-selection-toolbar": {
    alignItems: "center",
    backgroundColor:
      "var(--popover, var(--mira-popover, var(--mira-widget-background)))",
    border: "1px solid var(--border, var(--mira-border))",
    borderRadius: "999px",
    boxShadow: "var(--mira-widget-shadow)",
    boxSizing: "border-box",
    color:
      "var(--popover-foreground, var(--mira-popover-foreground, var(--mira-foreground)))",
    display: "flex",
    gap: "0.125rem",
    minHeight: "2.5rem",
    padding: "0.25rem 0.375rem",
    transform: "translateX(-50%)",
  },
  ".mira-selection-toolbar__button": {
    alignItems: "center",
    appearance: "none",
    background: "transparent",
    border: "1px solid transparent",
    borderRadius: "0.5rem",
    color: "var(--muted-foreground, var(--mira-muted-foreground))",
    cursor: "pointer",
    display: "inline-flex",
    height: "1.875rem",
    justifyContent: "center",
    margin: "0",
    padding: "0",
    width: "1.875rem",
  },
  ".mira-selection-toolbar__button:hover": {
    backgroundColor:
      "var(--accent, var(--background-modifier-hover, var(--mira-accent-soft)))",
    borderColor: "var(--border, var(--mira-border))",
    color: "var(--accent-foreground, var(--mira-foreground))",
  },
  ".mira-selection-toolbar__button:focus-visible": {
    backgroundColor:
      "var(--accent, var(--background-modifier-hover, var(--mira-accent-soft)))",
    borderColor: "var(--mira-focus-ring, var(--mira-accent))",
    color: "var(--accent-foreground, var(--mira-foreground))",
    outline: "2px solid var(--mira-focus-ring, var(--mira-accent))",
    outlineOffset: "1px",
  },
  ".mira-selection-toolbar__icon": {
    fill: "none",
    height: "1.125rem",
    pointerEvents: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: "2",
    width: "1.125rem",
  },
  '.mira-selection-toolbar[data-editor-active="false"]': {
    pointerEvents: "none",
    visibility: "hidden",
  },
});

/**
 * Show a compact formatting toolbar for a non-empty CodeMirror selection.
 * Prefer the higher-level `selectionToolbarExtension` when composing Mira.
 */
export function createSelectionToolbarExtension(
  config: MiraSelectionToolbarConfig = {},
): Extension {
  const resolved = resolveSelectionToolbarConfig(config);
  if (resolved.actions.length === 0) {
    return [];
  }

  const toolbarField = StateField.define<Tooltip | null>({
    create(state) {
      return selectionTooltip(state, resolved);
    },
    update(_value, transaction) {
      return selectionTooltip(transaction.state, resolved);
    },
    provide: (field) => showTooltip.from(field),
  });

  const keyboardAccess = Prec.high(
    keymap.of([
      {
        key: "Tab",
        run(view) {
          if (view.state.selection.main.empty) {
            return false;
          }
          const firstButton = view.dom.querySelector<HTMLButtonElement>(
            ".mira-selection-toolbar__button",
          );
          if (!firstButton) {
            return false;
          }
          firstButton.focus();
          return true;
        },
      },
    ]),
  );

  return [toolbarField, keyboardAccess, selectionToolbarTheme];
}

function resolveSelectionToolbarConfig(
  config: MiraSelectionToolbarConfig,
): ResolvedSelectionToolbarConfig {
  const actions = Array.from(
    new Set(config.actions ?? defaultMiraSelectionToolbarActions),
  );
  return {
    actions,
    ariaLabel: config.ariaLabel ?? "Text formatting",
    labels: { ...defaultActionLabels, ...config.labels },
    placement: config.placement ?? "below",
  };
}

function selectionTooltip(
  state: EditorState,
  config: ResolvedSelectionToolbarConfig,
): Tooltip | null {
  const selection = state.selection.main;
  if (selection.empty || state.facet(EditorState.readOnly)) {
    return null;
  }

  return {
    pos: selection.from,
    end: selection.to,
    above: config.placement === "above",
    create(view) {
      return new SelectionToolbarTooltipView(view, config);
    },
  };
}

class SelectionToolbarTooltipView implements TooltipView {
  readonly dom: HTMLElement;
  readonly offset = { x: 0, y: 8 };
  private mounted = false;

  constructor(
    private readonly view: EditorView,
    config: ResolvedSelectionToolbarConfig,
  ) {
    const ownerDocument = view.dom.ownerDocument;
    this.dom = ownerDocument.createElement("div");
    this.dom.className = "mira-selection-toolbar";
    this.dom.dataset.placement = config.placement;
    this.dom.setAttribute("role", "toolbar");
    this.dom.setAttribute("aria-label", config.ariaLabel);
    this.dom.addEventListener("keydown", (event) => {
      this.handleKeydown(event);
    });

    for (const action of config.actions) {
      this.dom.append(this.createButton(ownerDocument, action, config));
    }
    this.syncActiveState();
  }

  mount(): void {
    this.mounted = true;
    const ownerDocument = this.dom.ownerDocument;
    ownerDocument.addEventListener("focusin", this.handleFocusChange);
    ownerDocument.addEventListener("focusout", this.handleFocusChange);
    ownerDocument.defaultView?.addEventListener("blur", this.handleWindowBlur);
    this.syncActiveState();
  }

  destroy(): void {
    this.mounted = false;
    const ownerDocument = this.dom.ownerDocument;
    ownerDocument.removeEventListener("focusin", this.handleFocusChange);
    ownerDocument.removeEventListener("focusout", this.handleFocusChange);
    ownerDocument.defaultView?.removeEventListener(
      "blur",
      this.handleWindowBlur,
    );
  }

  getCoords = (position: number) => {
    const selection = this.view.state.selection.main;
    const start = this.view.coordsAtPos(selection.from, 1);
    const end = this.view.coordsAtPos(selection.to, -1);
    if (!start || !end) {
      return (
        this.view.coordsAtPos(position) ?? {
          left: 0,
          right: 0,
          top: -10_000,
          bottom: -10_000,
        }
      );
    }

    const center = start.left + Math.max(0, end.left - start.left) / 2;
    return {
      left: center,
      right: center,
      top: Math.min(start.top, end.top),
      bottom: Math.max(start.bottom, end.bottom),
    };
  };

  private handleFocusChange = (): void => {
    queueMicrotask(() => {
      if (this.mounted) {
        this.syncActiveState();
      }
    });
  };

  private handleWindowBlur = (): void => {
    this.dom.dataset.editorActive = "false";
  };

  private syncActiveState(): void {
    const activeElement = this.dom.ownerDocument.activeElement;
    const active = Boolean(
      activeElement &&
      (this.view.contentDOM.contains(activeElement) ||
        this.dom.contains(activeElement)),
    );
    this.dom.dataset.editorActive = active ? "true" : "false";
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      event.preventDefault();
      this.view.focus();
      return;
    }

    const buttons = Array.from(
      this.dom.querySelectorAll<HTMLButtonElement>(
        ".mira-selection-toolbar__button",
      ),
    );
    const activeIndex = buttons.indexOf(
      this.dom.ownerDocument.activeElement as HTMLButtonElement,
    );
    if (activeIndex < 0 || buttons.length === 0) {
      return;
    }

    const nextIndex =
      event.key === "ArrowRight"
        ? (activeIndex + 1) % buttons.length
        : event.key === "ArrowLeft"
          ? (activeIndex - 1 + buttons.length) % buttons.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? buttons.length - 1
              : null;
    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    buttons[nextIndex]?.focus();
  }

  private createButton(
    ownerDocument: Document,
    action: MiraSelectionToolbarActionId,
    config: ResolvedSelectionToolbarConfig,
  ): HTMLButtonElement {
    const label = config.labels[action];
    const button = ownerDocument.createElement("button");
    button.type = "button";
    button.className = "mira-selection-toolbar__button";
    button.dataset.miraSelectionAction = action;
    button.setAttribute("aria-label", label);
    button.title = label;
    button.append(createActionIcon(ownerDocument, action));
    button.addEventListener("pointerdown", preserveEditorSelection);
    button.addEventListener("mousedown", preserveEditorSelection);
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      applyMiraMarkdownAction(this.view, action);
    });
    return button;
  }
}

function preserveEditorSelection(event: Event): void {
  event.preventDefault();
}

function createActionIcon(
  ownerDocument: Document,
  action: MiraSelectionToolbarActionId,
): SVGSVGElement {
  const namespace = "http://www.w3.org/2000/svg";
  const svg = ownerDocument.createElementNS(namespace, "svg");
  svg.classList.add("mira-selection-toolbar__icon");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("viewBox", "0 0 24 24");

  for (const data of iconPaths[action]) {
    const path = ownerDocument.createElementNS(namespace, "path");
    path.setAttribute("d", data);
    svg.append(path);
  }
  return svg;
}
