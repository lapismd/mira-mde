import { EditorState, Transaction, type ChangeSpec } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { Root } from "mdast";
import type { Plugin } from "unified";
import { createMiraMarkdownLanguage } from "../internal/codemirror/markdown";
import {
  collectMiraDoodleDividerRules,
  formatMiraDoodleDividerComment,
  formatMiraDoodleDividerSeed,
  miraDuplicatedBlockRange,
  parseMiraDoodleDividerCommentLine,
  parseMiraDoodleDividerCommentValue,
  type MiraDoodleDividerRule,
} from "../internal/doodle-dividers";
import type { MiraExtension, MiraMarkdownPostProcessor } from ".";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const DEFAULT_WIDTH = 1000;
const DEFAULT_HEIGHT = 32;
const DEFAULT_STROKE_WIDTH = 2.35;

export type MiraDoodleDividerSeedReason =
  | "authoring"
  | "duplicate"
  | "migration";

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

  return {
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
    createSeed: options.createSeed ?? createRandomSeed,
  };
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

    return () => {
      svg.remove();
      contentEl.classList.remove("mira-doodle-divider__native");
      delete contentEl.dataset.miraDoodleDivider;
    };
  };
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
`;
