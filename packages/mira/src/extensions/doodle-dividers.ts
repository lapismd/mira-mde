import { EditorState, Transaction, type ChangeSpec } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { Root } from "mdast";
import type { Plugin } from "unified";
import { createMiraMarkdownLanguage } from "../internal/codemirror/markdown";
import {
  collectMiraDoodleDividerRules,
  formatMiraDoodleDividerComment,
  formatMiraDoodleDividerSeed,
  MIRA_DOODLE_DIVIDER_CONTROL_EVENT,
  miraDuplicatedBlockRange,
  parseMiraDoodleDividerCommentLine,
  parseMiraDoodleDividerCommentValue,
  registerMiraDoodleDividerController,
  type MiraDoodleDividerRule,
} from "../internal/doodle-dividers";
import type { MiraExtension, MiraMarkdownPostProcessor } from ".";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const DEFAULT_WIDTH = 1000;
const DEFAULT_HEIGHT = 32;
const DEFAULT_STROKE_WIDTH = 2.35;
const MAX_VARIANT_SEED_ATTEMPTS = 65_536;

export type MiraDoodleDividerSeedReason =
  | "authoring"
  | "duplicate"
  | "migration"
  | "reroll"
  | "variant";

export type MiraDoodleDividerSeedContext = {
  sourcePath?: string;
  line: number;
  offset: number;
  reason: MiraDoodleDividerSeedReason;
};

export type MiraDoodleDividerDrawContext = {
  seed: number;
  width: 1000;
  height: 32;
  random: () => number;
};

export type MiraDoodleDividerVariant = {
  id: string;
  draw: (context: MiraDoodleDividerDrawContext) => string | readonly string[];
};

export type MiraDoodleDividersOptions = {
  variants?: readonly MiraDoodleDividerVariant[];
  palette?: readonly string[];
  height?: number;
  strokeWidth?: number;
  /** Show reroll and family-selection controls in writable Live Preview. */
  controls?: boolean;
  createSeed?: (context: MiraDoodleDividerSeedContext) => number;
};

export type MiraDoodleDividerMaterializeOptions = Pick<
  MiraDoodleDividersOptions,
  "createSeed"
> & {
  sourcePath?: string;
};

export const defaultMiraDoodleDividerPalette: readonly string[] = Object.freeze(
  [
    "rgb(var(--mira-callout-default))",
    "rgb(var(--mira-callout-summary))",
    "rgb(var(--mira-callout-success))",
    "rgb(var(--mira-callout-example))",
  ],
);

export const defaultMiraDoodleDividerVariants: readonly MiraDoodleDividerVariant[] =
  Object.freeze(
    [
      variant("scribble", drawScribble),
      variant("waves", drawWaves),
      variant("loop", drawLoop),
      variant("zigzag", drawZigzag),
      variant("kink", drawKink),
      variant("swoop", drawSwoop),
      variant("notch", drawNotch),
      variant("plain", drawPlain),
    ].map((entry) => Object.freeze(entry)),
  );

type ResolvedDoodleDividerOptions = {
  variants: readonly MiraDoodleDividerVariant[];
  palette: readonly string[];
  height: number;
  strokeWidth: number;
  controls: boolean;
  createSeed: (context: MiraDoodleDividerSeedContext) => number;
};

type DoodleDividerDrawing = {
  color: string;
  colorIndex: number;
  paths: readonly string[];
  variant: MiraDoodleDividerVariant;
};

type DoodleDividerSeedChange = {
  from: number;
  insert: string;
};

export function doodleDividersExtension(
  options: MiraDoodleDividersOptions = {},
): MiraExtension {
  const resolved = resolveDoodleDividerOptions(options);
  const postProcessor = createDoodleDividerPostProcessor(resolved);

  const extension: MiraExtension = {
    name: "doodle-dividers",
    codeMirror({ mode, readonly, sourcePath }) {
      if (readonly || mode === "preview") {
        return null;
      }
      return createDoodleDividerAuthoringExtension(resolved, sourcePath);
    },
    commands: [
      {
        id: "mira-doodle-dividers-materialize",
        label: "Add IDs to existing dividers",
        description:
          "Add persistent Mira doodle-divider seeds to unseeded horizontal rules.",
        enabled(context) {
          return (
            !context.readonly &&
            context.mode !== "preview" &&
            context.view instanceof EditorView
          );
        },
        run(context) {
          if (!(context.view instanceof EditorView)) {
            return;
          }
          materializeDoodleDividerSeedsInView(
            context.view,
            resolved,
            context.sourcePath,
          );
        },
      },
    ],
    remarkPlugins: [remarkDoodleDividerSeeds],
    postProcessors: [postProcessor],
    styles: [
      {
        id: "mira-doodle-dividers",
        cssText: doodleDividerStyles,
      },
    ],
  };

  registerMiraDoodleDividerController(extension, {
    rerollSeed(currentSeed, context) {
      return createRerolledSeed(currentSeed, resolved, {
        ...context,
        reason: "reroll",
      });
    },
    selectVariantSeed(currentSeed, variantId, context) {
      return createSeedForVariant(currentSeed, variantId, resolved, {
        ...context,
        reason: "variant",
      });
    },
  });

  return extension;
}

export function materializeDoodleDividerSeeds(
  markdown: string,
  options: MiraDoodleDividerMaterializeOptions = {},
): string {
  const state = EditorState.create({
    doc: markdown,
    extensions: [createMiraMarkdownLanguage()],
  });
  const createSeed = options.createSeed ?? createRandomSeed;
  const changes = createSeedChanges(
    state,
    collectMiraDoodleDividerRules(state).filter((rule) => !rule.pair),
    createSeed,
    options.sourcePath,
    "migration",
  );

  let result = markdown;
  for (const change of changes.sort(changeFromDescending)) {
    result = `${result.slice(0, change.from)}${change.insert}${result.slice(change.from)}`;
  }
  return result;
}

export function createMiraDoodleDividerRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function resolveMiraDoodleDividerDrawing(
  seed: number,
  options: MiraDoodleDividersOptions = {},
): DoodleDividerDrawing | null {
  const resolved = resolveDoodleDividerOptions(options);
  return resolveDoodleDividerDrawing(seed, resolved);
}

function resolveDoodleDividerOptions(
  options: MiraDoodleDividersOptions,
): ResolvedDoodleDividerOptions {
  return {
    variants: options.variants ?? defaultMiraDoodleDividerVariants,
    palette: options.palette ?? defaultMiraDoodleDividerPalette,
    height: positiveNumber(options.height, DEFAULT_HEIGHT),
    strokeWidth: positiveNumber(options.strokeWidth, DEFAULT_STROKE_WIDTH),
    controls: options.controls ?? true,
    createSeed: options.createSeed ?? createRandomSeed,
  };
}

function createRerolledSeed(
  currentSeed: number,
  options: ResolvedDoodleDividerOptions,
  context: MiraDoodleDividerSeedContext,
): number | null {
  const currentVariant = resolveDoodleDividerDrawing(currentSeed, options)
    ?.variant.id;
  const firstCandidate = normalizedSeed(options.createSeed(context));

  for (let attempt = 0; attempt < MAX_VARIANT_SEED_ATTEMPTS; attempt += 1) {
    const candidate = (firstCandidate + attempt) >>> 0;
    if (candidate === currentSeed) {
      continue;
    }
    const drawing = resolveDoodleDividerDrawing(candidate, options);
    if (
      drawing &&
      (currentVariant === undefined || drawing.variant.id !== currentVariant)
    ) {
      return candidate;
    }
  }

  if (options.variants.length === 1) {
    for (let attempt = 0; attempt < MAX_VARIANT_SEED_ATTEMPTS; attempt += 1) {
      const candidate = (firstCandidate + attempt) >>> 0;
      if (
        candidate !== currentSeed &&
        resolveDoodleDividerDrawing(candidate, options)
      ) {
        return candidate;
      }
    }
  }

  return null;
}

function createSeedForVariant(
  currentSeed: number,
  variantId: string,
  options: ResolvedDoodleDividerOptions,
  context: MiraDoodleDividerSeedContext,
): number | null {
  const currentDrawing = resolveDoodleDividerDrawing(currentSeed, options);
  if (currentDrawing?.variant.id === variantId) {
    return currentSeed;
  }
  if (!options.variants.some((variant) => variant.id === variantId)) {
    return null;
  }

  const firstCandidate = normalizedSeed(options.createSeed(context));
  for (let attempt = 0; attempt < MAX_VARIANT_SEED_ATTEMPTS; attempt += 1) {
    const candidate = (firstCandidate + attempt) >>> 0;
    if (
      candidate !== currentSeed &&
      resolveDoodleDividerDrawing(candidate, options)?.variant.id === variantId
    ) {
      return candidate;
    }
  }
  return null;
}

function createDoodleDividerAuthoringExtension(
  options: ResolvedDoodleDividerOptions,
  sourcePath?: string,
) {
  return EditorState.transactionFilter.of((transaction) => {
    if (!transaction.docChanged || !transaction.isUserEvent("input")) {
      return transaction;
    }

    const duplicatedRange = transaction.annotation(miraDuplicatedBlockRange);
    const changedRanges = duplicatedRange
      ? [duplicatedRange]
      : collectChangedDocumentRanges(transaction);
    const rules = collectMiraDoodleDividerRules(
      transaction.state,
      changedRanges,
    );
    const reason: MiraDoodleDividerSeedReason = duplicatedRange
      ? "duplicate"
      : "authoring";
    const changes: ChangeSpec[] = [];

    for (const rule of rules) {
      if (rule.pair) {
        if (duplicatedRange) {
          changes.push({
            from: rule.pair.seedFrom,
            to: rule.pair.seedTo,
            insert: formatMiraDoodleDividerSeed(
              normalizedSeed(
                options.createSeed({
                  sourcePath,
                  line: rule.line,
                  offset: rule.from,
                  reason,
                }),
              ),
            ),
          });
        }
        continue;
      }

      changes.push(
        ...createSeedChanges(
          transaction.state,
          [rule],
          options.createSeed,
          sourcePath,
          reason,
        ),
      );
    }

    return changes.length > 0
      ? [transaction, { changes, sequential: true }]
      : transaction;
  });
}

function materializeDoodleDividerSeedsInView(
  view: EditorView,
  options: ResolvedDoodleDividerOptions,
  sourcePath?: string,
): void {
  const rules = collectMiraDoodleDividerRules(view.state).filter(
    (rule) => !rule.pair,
  );
  if (rules.length === 0) {
    return;
  }

  const scrollTop = view.scrollDOM.scrollTop;
  const scrollLeft = view.scrollDOM.scrollLeft;
  view.dispatch({
    changes: createSeedChanges(
      view.state,
      rules,
      options.createSeed,
      sourcePath,
      "migration",
    ),
    annotations: Transaction.userEvent.of("input.doodle-divider.migration"),
  });
  view.focus();
  view.scrollDOM.scrollTop = scrollTop;
  view.scrollDOM.scrollLeft = scrollLeft;
}

function createSeedChanges(
  state: EditorState,
  rules: readonly MiraDoodleDividerRule[],
  createSeed: (context: MiraDoodleDividerSeedContext) => number,
  sourcePath: string | undefined,
  reason: MiraDoodleDividerSeedReason,
): DoodleDividerSeedChange[] {
  return rules.map((rule) => {
    const seed = normalizedSeed(
      createSeed({
        sourcePath,
        line: rule.line,
        offset: rule.from,
        reason,
      }),
    );
    return {
      from: rule.lineFrom,
      insert: `${formatMiraDoodleDividerComment(seed, rule.prefix)}\n`,
    };
  });
}

function createDoodleDividerPostProcessor(
  options: ResolvedDoodleDividerOptions,
): MiraMarkdownPostProcessor {
  return (contentEl, node, parent) => {
    if (contentEl.tagName !== "HR") {
      return;
    }

    const seed = seedForRenderedRule(node, parent);
    if (seed === null) {
      return;
    }

    const drawing = resolveDoodleDividerDrawing(seed, options);
    if (!drawing) {
      return;
    }

    const ownerDocument = contentEl.ownerDocument;
    const existing = contentEl.nextElementSibling;
    if (existing?.classList.contains("mira-doodle-divider")) {
      existing.remove();
    }

    const svg = ownerDocument.createElementNS(SVG_NAMESPACE, "svg");
    svg.classList.add("mira-doodle-divider");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("viewBox", `0 0 ${DEFAULT_WIDTH} ${DEFAULT_HEIGHT}`);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.dataset.seed = formatMiraDoodleDividerSeed(seed);
    svg.dataset.variant = drawing.variant.id;
    svg.dataset.colorIndex = String(drawing.colorIndex);
    svg.style.color = drawing.color;
    svg.style.setProperty(
      "--mira-doodle-divider-height",
      `${options.height}px`,
    );
    svg.style.setProperty(
      "--mira-doodle-divider-stroke-width",
      String(options.strokeWidth),
    );

    for (const pathData of drawing.paths) {
      const path = ownerDocument.createElementNS(SVG_NAMESPACE, "path");
      path.setAttribute("d", pathData);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "currentColor");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      path.setAttribute("vector-effect", "non-scaling-stroke");
      svg.append(path);
    }

    contentEl.classList.add("mira-doodle-divider__native");
    contentEl.dataset.miraDoodleDivider = "true";
    contentEl.after(svg);
    const controls = options.controls
      ? mountDoodleDividerControls(contentEl, seed, drawing, options)
      : null;

    return () => {
      controls?.();
      svg.remove();
      contentEl.classList.remove("mira-doodle-divider__native");
      delete contentEl.dataset.miraDoodleDivider;
    };
  };
}

let doodleDividerMenuId = 0;

function mountDoodleDividerControls(
  contentEl: HTMLElement,
  seed: number,
  drawing: DoodleDividerDrawing,
  options: ResolvedDoodleDividerOptions,
): (() => void) | null {
  const widget = contentEl.closest<HTMLElement>(
    ".mira-rich-widget--horizontalrule",
  );
  if (!widget || widget.dataset.readonly === "true") {
    return null;
  }

  widget.querySelector<HTMLElement>(".mira-doodle-divider__controls")?.remove();
  const ownerDocument = contentEl.ownerDocument;
  const controls = ownerDocument.createElement("div");
  controls.className = "mira-doodle-divider__controls";
  controls.dataset.currentVariant = drawing.variant.id;

  const picker = createDoodleDividerControlButton(
    ownerDocument,
    "Choose divider style",
    createVariantPickerIcon(ownerDocument),
  );
  picker.classList.add("mira-doodle-divider__variant-trigger");
  picker.setAttribute("aria-haspopup", "menu");
  picker.setAttribute("aria-expanded", "false");

  const refresh = createDoodleDividerControlButton(
    ownerDocument,
    "Refresh divider style",
    createRefreshIcon(ownerDocument),
  );
  refresh.classList.add("mira-doodle-divider__refresh");

  const menu = ownerDocument.createElement("div");
  const menuId = `mira-doodle-divider-menu-${++doodleDividerMenuId}`;
  menu.id = menuId;
  menu.className = "mira-doodle-divider__variant-menu";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", "Divider style");
  menu.hidden = true;
  picker.setAttribute("aria-controls", menuId);

  const seenVariantIds = new Set<string>();
  for (const variant of options.variants) {
    if (seenVariantIds.has(variant.id)) {
      continue;
    }
    seenVariantIds.add(variant.id);
    const item = ownerDocument.createElement("button");
    const active = variant.id === drawing.variant.id;
    item.type = "button";
    item.className = "mira-doodle-divider__variant-item";
    item.dataset.variant = variant.id;
    item.setAttribute("role", "menuitemradio");
    item.setAttribute("aria-checked", String(active));
    item.tabIndex = -1;
    if (active) {
      item.dataset.current = "true";
    }

    const preview = createVariantPreview(ownerDocument, variant);
    if (preview) {
      item.append(preview);
    }
    const label = ownerDocument.createElement("span");
    label.textContent = variantLabel(variant.id);
    item.append(label);
    if (active) {
      item.append(createCheckIcon(ownerDocument));
    }
    item.addEventListener("mousedown", stopWidgetPointerEvent);
    item.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeMenu(false);
      if (!active) {
        dispatchDoodleDividerControl(controls, {
          action: "variant",
          variantId: variant.id,
        });
      }
    });
    menu.append(item);
  }

  let outsidePointerListening = false;
  const menuItems = () =>
    Array.from(
      menu.querySelectorAll<HTMLButtonElement>(
        '[role="menuitemradio"]:not(:disabled)',
      ),
    );
  const selectedMenuItem = () =>
    menu.querySelector<HTMLButtonElement>('[aria-checked="true"]') ??
    menuItems()[0] ??
    null;
  const handleOutsidePointer = (event: Event) => {
    if (!controls.contains(event.target as Node)) {
      closeMenu(false);
    }
  };
  const listenForOutsidePointer = () => {
    if (outsidePointerListening) {
      return;
    }
    ownerDocument.addEventListener("pointerdown", handleOutsidePointer, true);
    outsidePointerListening = true;
  };
  const stopListeningForOutsidePointer = () => {
    if (!outsidePointerListening) {
      return;
    }
    ownerDocument.removeEventListener(
      "pointerdown",
      handleOutsidePointer,
      true,
    );
    outsidePointerListening = false;
  };
  const openMenu = (focus: "selected" | "last" = "selected") => {
    menu.hidden = false;
    controls.dataset.open = "true";
    picker.setAttribute("aria-expanded", "true");
    listenForOutsidePointer();
    requestAnimationFrame(() => {
      const items = menuItems();
      (focus === "last" ? items.at(-1) : selectedMenuItem())?.focus();
    });
  };
  const closeMenu = (returnFocus: boolean) => {
    menu.hidden = true;
    delete controls.dataset.open;
    picker.setAttribute("aria-expanded", "false");
    stopListeningForOutsidePointer();
    if (returnFocus) {
      picker.focus();
    }
  };

  picker.addEventListener("mousedown", stopWidgetPointerEvent);
  picker.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (menu.hidden) {
      openMenu();
    } else {
      closeMenu(true);
    }
  });
  picker.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      openMenu(event.key === "ArrowUp" ? "last" : "selected");
    }
  });
  refresh.addEventListener("mousedown", stopWidgetPointerEvent);
  refresh.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeMenu(false);
    dispatchDoodleDividerControl(controls, { action: "reroll" });
  });
  menu.addEventListener("keydown", (event) => {
    const items = menuItems();
    const currentIndex = items.indexOf(
      ownerDocument.activeElement as HTMLButtonElement,
    );
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeMenu(true);
      return;
    }
    if (event.key === "Tab") {
      closeMenu(false);
      return;
    }
    if (
      event.key !== "ArrowDown" &&
      event.key !== "ArrowUp" &&
      event.key !== "Home" &&
      event.key !== "End"
    ) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : event.key === "ArrowDown"
            ? (currentIndex + 1 + items.length) % items.length
            : (currentIndex - 1 + items.length) % items.length;
    items[nextIndex]?.focus();
  });

  controls.append(picker, refresh, menu);
  const sourceToggle = widget.querySelector<HTMLElement>(
    ":scope > .mira-rich-widget__source-toggle",
  );
  if (sourceToggle) {
    sourceToggle.before(controls);
  } else {
    widget.prepend(controls);
  }

  return () => {
    stopListeningForOutsidePointer();
    controls.remove();
  };
}

function createDoodleDividerControlButton(
  ownerDocument: Document,
  label: string,
  icon: SVGSVGElement,
): HTMLButtonElement {
  const button = ownerDocument.createElement("button");
  button.type = "button";
  button.className =
    "mira-doodle-divider__control markdown-widget-select-control";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.append(icon);
  return button;
}

function createVariantPreview(
  ownerDocument: Document,
  variant: MiraDoodleDividerVariant,
): SVGSVGElement | null {
  try {
    const result = variant.draw({
      seed: hashString(variant.id),
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      random: createMiraDoodleDividerRandom(
        mixSeed(hashString(variant.id), 0x51f15e5d),
      ),
    });
    const paths = (typeof result === "string" ? [result] : [...result]).filter(
      isValidPathData,
    );
    if (paths.length === 0) {
      return null;
    }
    const svg = createControlIcon(ownerDocument, "0 0 1000 32");
    svg.classList.add("mira-doodle-divider__variant-preview");
    svg.setAttribute("preserveAspectRatio", "none");
    for (const pathData of paths) {
      appendControlPath(svg, pathData);
    }
    return svg;
  } catch {
    return null;
  }
}

function createRefreshIcon(ownerDocument: Document): SVGSVGElement {
  const svg = createControlIcon(ownerDocument);
  appendControlPath(svg, "M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5");
  appendControlPath(svg, "M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5");
  return svg;
}

function createVariantPickerIcon(ownerDocument: Document): SVGSVGElement {
  const svg = createControlIcon(ownerDocument);
  appendControlPath(svg, "M4 7c3-4 5 4 8 0s5 4 8 0");
  appendControlPath(svg, "M4 15c3-4 5 4 8 0s5 4 8 0");
  return svg;
}

function createCheckIcon(ownerDocument: Document): SVGSVGElement {
  const svg = createControlIcon(ownerDocument);
  svg.classList.add("mira-doodle-divider__variant-check");
  appendControlPath(svg, "m5 12 4 4L19 6");
  return svg;
}

function createControlIcon(
  ownerDocument: Document,
  viewBox = "0 0 24 24",
): SVGSVGElement {
  const svg = ownerDocument.createElementNS(SVG_NAMESPACE, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("viewBox", viewBox);
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.classList.add("mira-doodle-divider__control-icon", "svg-icon");
  return svg;
}

function appendControlPath(svg: SVGSVGElement, pathData: string): void {
  const path = svg.ownerDocument.createElementNS(SVG_NAMESPACE, "path");
  path.setAttribute("d", pathData);
  svg.append(path);
}

function stopWidgetPointerEvent(event: MouseEvent): void {
  event.preventDefault();
  event.stopPropagation();
}

function dispatchDoodleDividerControl(
  target: HTMLElement,
  detail: { action: "reroll" } | { action: "variant"; variantId: string },
): void {
  const CustomEventConstructor =
    target.ownerDocument.defaultView?.CustomEvent ?? CustomEvent;
  target.dispatchEvent(
    new CustomEventConstructor(MIRA_DOODLE_DIVIDER_CONTROL_EVENT, {
      bubbles: true,
      detail,
    }),
  );
}

function variantLabel(id: string): string {
  const label = id.replace(/[-_]+/gu, " ").trim();
  return label.length > 0
    ? `${label.charAt(0).toUpperCase()}${label.slice(1)}`
    : "Custom";
}

function seedForRenderedRule(node: unknown, parent: unknown): number | null {
  const typedNode = node as {
    type?: string;
    tagName?: string;
    properties?: Record<string, unknown>;
  };
  const typedParent = parent as { children?: unknown[] } | null;
  if (typedNode.type !== "element" || typedNode.tagName !== "hr") {
    return null;
  }

  const property = typedNode.properties?.["data-mira-doodle-divider-seed"];
  if (typeof property === "string" && /^[0-9a-f]{8}$/u.test(property)) {
    return Number.parseInt(property, 16) >>> 0;
  }

  if (!Array.isArray(typedParent?.children)) {
    return null;
  }

  const index = typedParent.children.indexOf(node);
  const previous = typedParent.children[index - 1] as
    | { type?: string; value?: string }
    | undefined;
  return previous?.type === "comment" && typeof previous.value === "string"
    ? parseMiraDoodleDividerCommentValue(previous.value)
    : null;
}

const remarkDoodleDividerSeeds: Plugin<[], Root> = () => {
  return (tree) => {
    visitMdastParents(tree as MdastParent);
  };
};

type MdastNode = {
  type?: string;
  value?: string;
  data?: {
    hProperties?: Record<string, unknown>;
    [key: string]: unknown;
  };
  children?: MdastNode[];
};

type MdastParent = MdastNode & { children: MdastNode[] };

function visitMdastParents(parent: MdastParent): void {
  for (let index = 0; index < parent.children.length; index += 1) {
    const node = parent.children[index]!;
    const previous = parent.children[index - 1];
    if (
      node.type === "thematicBreak" &&
      previous?.type === "html" &&
      typeof previous.value === "string"
    ) {
      const parsed = parseMiraDoodleDividerCommentLine(previous.value);
      if (parsed) {
        node.data = {
          ...(node.data ?? {}),
          hProperties: {
            ...(node.data?.hProperties ?? {}),
            "data-mira-doodle-divider-seed": formatMiraDoodleDividerSeed(
              parsed.seed,
            ),
          },
        };
      }
    }

    if (Array.isArray(node.children)) {
      visitMdastParents(node as MdastParent);
    }
  }
}

function resolveDoodleDividerDrawing(
  seed: number,
  options: ResolvedDoodleDividerOptions,
): DoodleDividerDrawing | null {
  if (options.variants.length === 0 || options.palette.length === 0) {
    return null;
  }

  const variantSeed = mixSeed(seed, 0x9e3779b9);
  const colorSeed = mixSeed(seed, 0x85ebca6b);
  const variant = options.variants[variantSeed % options.variants.length];
  const colorIndex = colorSeed % options.palette.length;
  const color = options.palette[colorIndex];
  if (!variant || !color) {
    return null;
  }

  try {
    const random = createMiraDoodleDividerRandom(
      mixSeed(seed, hashString(variant.id)),
    );
    const result = variant.draw({
      seed,
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      random,
    });
    const paths = (typeof result === "string" ? [result] : [...result]).filter(
      isValidPathData,
    );
    return paths.length > 0 ? { color, colorIndex, paths, variant } : null;
  } catch {
    return null;
  }
}

function collectChangedDocumentRanges(transaction: Transaction) {
  const ranges: Array<{ from: number; to: number }> = [];
  transaction.changes.iterChangedRanges((_fromA, _toA, fromB, toB) => {
    ranges.push({ from: fromB, to: toB });
  });
  return ranges;
}

function variant(
  id: string,
  draw: MiraDoodleDividerVariant["draw"],
): MiraDoodleDividerVariant {
  return { id, draw };
}

function drawScribble({ random }: MiraDoodleDividerDrawContext): string {
  const parts = [`M 6 ${number(23 + jitter(random, 1))}`];
  let x = 6;
  for (let index = 0; index < 18; index += 1) {
    const width = 10.2 + jitter(random, 1.15);
    const peakY = 5.5 + jitter(random, 1.8);
    const troughY = 24.5 + jitter(random, 1.7);
    const peakX = x + width * (0.42 + jitter(random, 0.035));
    const endX = x + width;
    parts.push(
      `C ${number(x + width * 0.12)} ${number(21 + jitter(random, 1.2))} ${number(peakX - width * 0.12)} ${number(peakY + 1.5)} ${number(peakX)} ${number(peakY)}`,
      `C ${number(peakX + width * 0.13)} ${number(peakY - 0.5)} ${number(endX - width * 0.16)} ${number(troughY - 1)} ${number(endX)} ${number(troughY)}`,
    );
    x = endX;
  }
  parts.push(tail(x, 16 + jitter(random, 1), random));
  return parts.join(" ");
}

function drawWaves({ random }: MiraDoodleDividerDrawContext): string {
  const parts = [`M 6 ${number(16 + jitter(random, 1))}`];
  for (let x = 6; x < 174; x += 28) {
    parts.push(
      `Q ${number(x + 7)} ${number(5 + jitter(random, 1.5))} ${number(x + 14)} ${number(16 + jitter(random, 0.75))}`,
      `Q ${number(x + 21)} ${number(27 + jitter(random, 1.5))} ${number(x + 28)} ${number(16 + jitter(random, 0.75))}`,
    );
  }
  parts.push(tail(174, 16, random));
  return parts.join(" ");
}

function drawLoop({ random }: MiraDoodleDividerDrawContext): string {
  const y = 16 + jitter(random, 1);
  return [
    `M 6 ${number(y)}`,
    `C 34 ${number(12 + jitter(random, 2))} 56 ${number(13 + jitter(random, 2))} 72 ${number(y)}`,
    `C 94 ${number(20 + jitter(random, 1.5))} 92 ${number(29 + jitter(random, 1))} 78 ${number(28 + jitter(random, 1))}`,
    `C 61 ${number(26 + jitter(random, 1))} 67 ${number(9 + jitter(random, 1))} 100 ${number(11 + jitter(random, 1.5))}`,
    `C 126 ${number(13 + jitter(random, 1))} 150 ${number(16 + jitter(random, 1))} 176 ${number(y)}`,
    tail(176, y, random),
  ].join(" ");
}

function drawZigzag({ random }: MiraDoodleDividerDrawContext): string {
  const parts = [`M 6 ${number(18 + jitter(random, 1))}`];
  let x = 6;
  for (let index = 0; index < 8; index += 1) {
    x += 20;
    parts.push(
      `L ${number(x)} ${number((index % 2 === 0 ? 6 : 24) + jitter(random, 1.4))}`,
    );
  }
  parts.push(tail(x, 16, random));
  return parts.join(" ");
}

function drawKink({ random }: MiraDoodleDividerDrawContext): string {
  const y = 17 + jitter(random, 1);
  return [
    `M 6 ${number(y)}`,
    `C 28 ${number(5 + jitter(random, 1.2))} 36 ${number(5 + jitter(random, 1.2))} 42 ${number(15 + jitter(random, 1))}`,
    `C 50 ${number(27 + jitter(random, 1.2))} 70 ${number(25 + jitter(random, 1.2))} 92 ${number(12 + jitter(random, 1.5))}`,
    `C 113 ${number(1 + jitter(random, 1.2))} 121 ${number(25 + jitter(random, 1.2))} 146 ${number(17 + jitter(random, 1))}`,
    `C 158 ${number(13 + jitter(random, 1))} 166 ${number(15 + jitter(random, 1))} 180 ${number(y)}`,
    tail(180, y, random),
  ].join(" ");
}

function drawSwoop({ random }: MiraDoodleDividerDrawContext): string {
  const y = 16 + jitter(random, 0.75);
  return [
    `M 6 ${number(y)}`,
    `C 38 ${number(11 + jitter(random, 1.4))} 59 ${number(10 + jitter(random, 1.4))} 78 ${number(15 + jitter(random, 1))}`,
    `C 100 ${number(21 + jitter(random, 1.3))} 94 ${number(29 + jitter(random, 1))} 82 ${number(27 + jitter(random, 1))}`,
    `C 67 ${number(25 + jitter(random, 1))} 75 ${number(11 + jitter(random, 1))} 112 ${number(12 + jitter(random, 1.5))}`,
    `C 138 ${number(13 + jitter(random, 1))} 160 ${number(14 + jitter(random, 1))} 184 ${number(y)}`,
    tail(184, y, random),
  ].join(" ");
}

function drawNotch({ random }: MiraDoodleDividerDrawContext): string {
  const y = 16 + jitter(random, 0.7);
  return [
    `M 6 ${number(y)}`,
    `C 58 ${number(14 + jitter(random, 1))} 102 ${number(14 + jitter(random, 1))} 142 ${number(y)}`,
    `L 158 ${number(8 + jitter(random, 1))}`,
    `L 174 ${number(23 + jitter(random, 1))}`,
    `L 190 ${number(y)}`,
    tail(190, y, random),
  ].join(" ");
}

function drawPlain({ random }: MiraDoodleDividerDrawContext): string {
  const start = 16 + jitter(random, 0.9);
  const middle = 13 + jitter(random, 1.1);
  const end = 17 + jitter(random, 0.9);
  return `M 6 ${number(start)} C 310 ${number(middle)} 690 ${number(middle)} 994 ${number(end)}`;
}

function tail(startX: number, startY: number, random: () => number): string {
  const settledY = 17 + jitter(random, 0.45);
  const middleY = settledY - 0.3 + jitter(random, 0.15);
  const endY = settledY + 0.2 + jitter(random, 0.2);
  return [
    `C ${number(startX + 18)} ${number(startY)} ${number(startX + 38)} ${number(settledY)} ${number(startX + 68)} ${number(settledY)}`,
    `C ${number(startX + 290)} ${number(middleY)} 748 ${number(middleY)} 994 ${number(endY)}`,
  ].join(" ");
}

function mixSeed(seed: number, salt: number): number {
  let value = (seed ^ salt) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  return (value ^ (value >>> 16)) >>> 0;
}

function hashString(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function createRandomSeed(): number {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    return cryptoApi.getRandomValues(new Uint32Array(1))[0] ?? 0;
  }
  return Math.floor(Math.random() * 4_294_967_296) >>> 0;
}

function normalizedSeed(seed: number): number {
  return Number.isFinite(seed) ? Math.trunc(seed) >>> 0 : createRandomSeed();
}

function positiveNumber(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function jitter(random: () => number, amount: number): number {
  return (random() * 2 - 1) * amount;
}

function number(value: number): string {
  return value.toFixed(2).replace(/\.00$/u, "");
}

function isValidPathData(value: string): boolean {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    !/(?:NaN|Infinity)/u.test(value)
  );
}

function changeFromDescending(
  left: DoodleDividerSeedChange,
  right: DoodleDividerSeedChange,
): number {
  return right.from - left.from;
}

const doodleDividerStyles = `
hr.mira-doodle-divider__native {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  margin: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.mira-doodle-divider {
  display: block;
  inline-size: 100%;
  block-size: var(--mira-doodle-divider-height, 32px);
  box-sizing: border-box;
  padding-block: 6px;
  overflow: visible;
  pointer-events: none;
}

.mira-rich-widget--horizontalrule .mira-doodle-divider,
.markdown-live-preview-mode .mira-doodle-divider {
  margin: 0;
}

.mira-doodle-divider path {
  stroke-width: var(--mira-doodle-divider-stroke-width, 2.35);
}

.mira-doodle-divider__controls {
  position: absolute;
  inset-block-start: 0.25rem;
  inset-inline-end: 2rem;
  z-index: 10;
  display: inline-flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 120ms ease;
}

.mira-rich-widget--horizontalrule:hover .mira-doodle-divider__controls,
.mira-rich-widget--horizontalrule:focus-within .mira-doodle-divider__controls,
.mira-doodle-divider__controls[data-open="true"] {
  opacity: 1;
}

.mira-doodle-divider__control {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 1.5rem;
  block-size: 1.5rem;
  padding: 0;
  color: var(--mira-muted-foreground);
  background: var(--mira-popover);
  border: 1px solid var(--mira-border);
  border-radius: 4px;
  box-shadow: var(--mira-widget-shadow);
  cursor: pointer;
  line-height: 1;
  transition: color 120ms ease, background 120ms ease;
}

.mira-doodle-divider__control:hover,
.mira-doodle-divider__control:focus-visible,
.mira-doodle-divider__variant-trigger[aria-expanded="true"] {
  color: var(--mira-foreground);
  background: var(--mira-accent-soft);
}

.mira-doodle-divider__control:focus-visible,
.mira-doodle-divider__variant-item:focus-visible {
  outline: 2px solid var(--mira-focus-ring, var(--mira-accent));
  outline-offset: 1px;
}

.mira-doodle-divider__control-icon {
  inline-size: 0.95rem;
  block-size: 0.95rem;
  pointer-events: none;
}

.mira-doodle-divider__variant-menu {
  position: absolute;
  inset-block-start: calc(100% + 0.25rem);
  inset-inline-end: 0;
  z-index: 20;
  display: grid;
  gap: 0.125rem;
  inline-size: 13.5rem;
  max-block-size: min(20rem, 60vh);
  padding: 0.25rem;
  overflow-y: auto;
  color: var(--mira-popover-foreground, var(--mira-foreground));
  background: var(--mira-popover);
  border: 1px solid var(--mira-border);
  border-radius: var(--mira-radius, 0.5rem);
  box-shadow: var(--mira-widget-shadow);
}

.mira-doodle-divider__variant-menu[hidden] {
  display: none;
}

.mira-doodle-divider__variant-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-block-size: 2rem;
  inline-size: 100%;
  padding: 0.25rem 0.5rem;
  color: inherit;
  font: inherit;
  text-align: start;
  background: transparent;
  border: 0;
  border-radius: calc(var(--mira-radius, 0.5rem) - 0.125rem);
  cursor: pointer;
}

.mira-doodle-divider__variant-item:hover,
.mira-doodle-divider__variant-item:focus-visible,
.mira-doodle-divider__variant-item[data-current="true"] {
  background: var(--mira-accent-soft);
}

.mira-doodle-divider__variant-preview {
  flex: 0 0 3rem;
  inline-size: 3rem;
  block-size: 1rem;
  color: currentColor;
}

.mira-doodle-divider__variant-preview path {
  stroke-width: 2.35;
  vector-effect: non-scaling-stroke;
}

.mira-doodle-divider__variant-check {
  flex: 0 0 auto;
  margin-inline-start: auto;
}
`;
