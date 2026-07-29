import { ensureSyntaxTree, syntaxTree } from "@codemirror/language";
import {
  EditorState,
  StateField,
  type Extension,
  type Range,
} from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  type PluginValue,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import type { MiraResolvedListCallout } from "@mira-mde/extensions";
import { resolveMiraExtensions } from "@mira-mde/extensions";
import { miraRichEditorTheme } from "./theme";
import type { MiraRichEditorOptions } from "./types";
import { codeBlockLineDecorations } from "./utils/code-block-lines";
import { getFencedCodeLanguage } from "./utils/fenced-code";
import {
  getAtxHeadingMarkerRange,
  selectionTouchesLine,
} from "./utils/headings";
import { getTaskMarkerRange, selectionTouchesTaskMarker } from "./utils/tasks";
import {
  findMarkdownImageRanges,
  isStandaloneMarkdownImageLine,
  resolveMarkdownImageWidgetSource,
} from "./utils/images";
import {
  findInlineCodeRanges,
  isPositionInsideRanges,
} from "./utils/inline-code";
import { findInlineMathRanges } from "./utils/inline-math";
import { indentGuideDecorations } from "./utils/indent";
import { measuredIndentExtension } from "./utils/measured-indent";
import {
  getMarkdownLinkTextRange,
  isBareExternalAutolinkUrl,
  isExternalMarkdownLink,
} from "./utils/links";
import {
  createListCalloutMatcher,
  type ListCalloutMatcher,
} from "./utils/list-callouts";
import {
  hasInitialFrontmatterCursor,
  hasRenderedInitialFrontmatterCursor,
  rangeContainsSelectionCursor,
  rangeIntersectsSelection,
  rangesOverlap,
  sortRanges,
  type RangeBoundary,
} from "./utils/ranges";
import { blockControlExtensions } from "./block-controls";
import { foldIndicatorDecorations } from "./decorations/fold-indicators";
import { headingGutterExtension } from "./decorations/heading-gutter";
import {
  BlockPreviewWidget,
  InlineMarkdownWidget,
  InlineMathWidget,
} from "./widgets/preview-widgets";
import { TaskCheckboxWidget } from "./widgets/task-checkbox";

export { getFoldAnchor } from "./decorations/fold-indicators";
export {
  PREVIEW_INTERACTIVE_SELECTOR,
  shouldActivateEditablePreview,
} from "./utils/activation";

export type { MiraRichEditorOptions } from "./types";
export {
  buildCodeBlockLineDecorations,
  codeBlockLineDecorations,
} from "./utils/code-block-lines";
export {
  getFencedCodeLanguage,
  getFencedCodeWidgetRange,
} from "./utils/fenced-code";
export {
  getAtxHeadingMarkerRange,
  selectionTouchesLine,
} from "./utils/headings";
export { getTaskMarkerRange, selectionTouchesTaskMarker } from "./utils/tasks";
export { estimateMarkdownBlockHeight } from "./utils/height-estimates";
export {
  findInlineMathRanges,
  type InlineMathRange,
} from "./utils/inline-math";
export {
  getIndentLineLayout,
  getLineIndentInfo,
  normalizeIndentText,
  selectionTouchesIndent,
  splitIndentSegments,
  toMarkdownColumns,
} from "./utils/indent";
export {
  measuredIndentExtension,
  syncMeasuredIndentStyles,
} from "./utils/measured-indent";
export {
  getMarkdownLinkTextRange,
  isBareExternalAutolinkUrl,
  isExternalMarkdownDestination,
  isExternalMarkdownLink,
} from "./utils/links";
export {
  collectMarkdownBlockHandles,
  collectMarkdownBlockRanges,
  deleteMarkdownBlockHandle,
  deleteMarkdownBlockRange,
  duplicateMarkdownBlockHandle,
  duplicateMarkdownBlockRange,
  markdownBlockAt,
  moveMarkdownBlockHandle,
  moveMarkdownBlockRange,
  replaceMarkdownRange,
  type MiraMarkdownBlockHandleMoveTarget,
  type MiraMarkdownBlockMoveTarget,
} from "./block-ranges";

const BLOCK_WIDGET_NODE_NAMES = new Set([
  "Frontmatter",
  "FencedCode",
  "HorizontalRule",
  "BlockMathDollar",
  "BlockMathBracket",
  "Blockquote",
  "Table",
  "GridTable",
  "LeafDirective",
  "ContainerDirective",
]);

const hiddenFormattingMark = Decoration.mark({
  class: "cm-formatting cm-formatting-hidden",
});
const strongMark = Decoration.mark({ class: "cm-strong" });
const emphasisMark = Decoration.mark({ class: "cm-emphasis" });
const strikethroughMark = Decoration.mark({ class: "cm-strikethrough" });
const inlineCodeMark = Decoration.mark({ class: "cm-inline-code" });
const internalLinkMark = Decoration.mark({ class: "cm-internal-link" });
const externalLinkMark = Decoration.mark({ class: "cm-external-link" });
const linkTextMark = Decoration.mark({
  class: "cm-link-text cm-link-string",
});
const linkTargetMark = Decoration.mark({ class: "cm-link-target" });
const linkPathTargetMark = Decoration.mark({
  class: "cm-path cm-link-target",
});

const INLINE_SOURCE_TOKEN_NAMES = new Set([
  "Emphasis",
  "StrongEmphasis",
  "Strikethrough",
  "StrikethroughEmphasis",
  "InlineCode",
  "CodeBlock",
  "Link",
  "PathLink",
  "WikiLink",
  "EmbedLink",
  "Image",
]);

const INLINE_FORMATTING_NODE_NAMES = new Set([
  "HardBreak",
  "LinkMark",
  "PathLinkMark",
  "PathLinkDestination",
  "EmphasisMark",
  "CodeMark",
  "StrikethroughMark",
  "URL",
]);

export function createRichEditorExtensions(
  options: MiraRichEditorOptions = {},
): Extension[] {
  if (options.enabled === false) {
    return [];
  }

  const livePreview = options.livePreview ?? true;
  const extensionListCallouts = resolveMiraExtensions(options.extensions, {
    mode: livePreview ? "live-preview" : "source",
    readonly: false,
    sourcePath: options.sourcePath,
  }).listCallouts;
  const resolvedOptions: MiraRichEditorOptions = {
    ...options,
    listCallouts: [...extensionListCallouts, ...(options.listCallouts ?? [])],
  };

  return [
    miraRichEditorTheme,
    codeBlockLineDecorations(),
    headingGutterExtension(),
    resolvedOptions.indentGuides !== false
      ? [indentGuideDecorations(), measuredIndentExtension()]
      : [],
    livePreview ? blockPreviewDecorations(resolvedOptions) : [],
    // Inline marks (code/strong/emphasis + hide ticks) run in source and live
    // preview; replace widgets stay live-preview-only.
    inlinePreviewDecorations({ ...resolvedOptions, livePreview }),
    foldIndicatorDecorations(),
    blockControlExtensions(resolvedOptions),
    livePreview
      ? EditorView.editorAttributes.compute(["doc", "selection"], (state) => ({
          class: [
            "mira-mde-live-preview-mode markdown-live-preview-mode markdown-live-preview-view cm-live-preview",
            hasRenderedInitialFrontmatterCursor(state)
              ? "mira-mde-live-preview-hide-cursor"
              : "",
          ]
            .filter(Boolean)
            .join(" "),
        }))
      : [],
  ];
}

function blockPreviewDecorations(options: MiraRichEditorOptions): Extension {
  return StateField.define<DecorationSet>({
    create(state) {
      return buildBlockPreviewDecorations(state, options);
    },
    update(value, transaction) {
      if (transaction.docChanged || transaction.selection) {
        return buildBlockPreviewDecorations(transaction.state, options);
      }
      return value.map(transaction.changes);
    },
    provide: (field) => EditorView.decorations.from(field),
  });
}

function inlinePreviewDecorations(options: MiraRichEditorOptions): Extension {
  return ViewPlugin.fromClass(
    class implements PluginValue {
      decorations: DecorationSet;

      constructor(private readonly view: EditorView) {
        this.decorations = buildInlinePreviewDecorations(view, options);
      }

      update(update: ViewUpdate): void {
        if (
          update.docChanged ||
          update.selectionSet ||
          update.viewportChanged
        ) {
          this.decorations = buildInlinePreviewDecorations(
            update.view,
            options,
          );
        }
      }
    },
    {
      decorations: (value) => value.decorations,
    },
  );
}

function buildBlockPreviewDecorations(
  state: EditorState,
  options: MiraRichEditorOptions,
): DecorationSet {
  const ranges: Range<Decoration>[] = [];
  const replacedRanges: RangeBoundary[] = [];
  const tree =
    ensureSyntaxTree(state, state.doc.length, 100) ?? syntaxTree(state);

  tree.iterate({
    from: 0,
    to: state.doc.length,
    enter: (node) => {
      if (!BLOCK_WIDGET_NODE_NAMES.has(node.name)) {
        return;
      }

      const from = state.doc.lineAt(node.from).from;
      const to = state.doc.lineAt(node.to).to;
      const selectionInside =
        node.name === "Frontmatter"
          ? rangeContainsSelectionCursor(state, from, to) &&
            !hasInitialFrontmatterCursor(state, from)
          : rangeContainsSelectionCursor(state, from, to);

      if (
        selectionInside &&
        (node.name === "BlockMathDollar" || node.name === "BlockMathBracket") &&
        !replacedRanges.some((range) => rangesOverlap(range, { from, to }))
      ) {
        const markdown = state.doc.sliceString(from, to);
        ranges.push(
          Decoration.widget({
            block: true,
            side: 1,
            widget: new BlockPreviewWidget({
              from,
              to,
              markdown,
              nodeName: node.name,
              options,
            }),
          }).range(to),
        );
        return false;
      }

      if (
        selectionInside ||
        replacedRanges.some((range) => rangesOverlap(range, { from, to }))
      ) {
        return;
      }

      const markdown = state.doc.sliceString(from, to);
      ranges.push(
        Decoration.replace({
          block: true,
          widget: new BlockPreviewWidget({
            from,
            to,
            markdown,
            nodeName: node.name,
            options,
          }),
        }).range(from, to),
      );
      replacedRanges.push({ from, to });
      return false;
    },
  });

  for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber += 1) {
    const line = state.doc.line(lineNumber);
    const standaloneEmbed = isStandaloneEmbedLine(line.text);
    const standaloneImage = isStandaloneMarkdownImageLine(line.text);
    if (!standaloneEmbed && !standaloneImage) {
      continue;
    }

    const from = line.from;
    const to = line.to;
    if (
      rangeContainsSelectionCursor(state, from, to) ||
      replacedRanges.some((range) => rangesOverlap(range, { from, to }))
    ) {
      continue;
    }

    const markdown = standaloneEmbed
      ? line.text.trim()
      : resolveMarkdownImageWidgetSource(line.text, state.doc.toString());
    if (!markdown) {
      continue;
    }

    ranges.push(
      Decoration.replace({
        block: true,
        widget: new BlockPreviewWidget({
          from,
          to,
          markdown,
          nodeName: standaloneEmbed ? "EmbedLink" : "Image",
          options,
        }),
      }).range(from, to),
    );
    replacedRanges.push({ from, to });
  }

  return Decoration.set(sortRanges(ranges), true);
}

function buildInlinePreviewDecorations(
  view: EditorView,
  options: MiraRichEditorOptions,
): DecorationSet {
  const ranges: Range<Decoration>[] = [];
  const replaceWidgets = options.livePreview ?? true;
  const fencedCodeLineClasses = getFencedCodeLineClasses(view.state);
  const listCalloutMatcher = createListCalloutMatcher(options.listCallouts);
  const syntaxHiddenRanges: RangeBoundary[] = [];
  const activeInlineSourceRanges: RangeBoundary[] = [];
  if (replaceWidgets) {
    collectActiveTaskMarkerRanges(view, activeInlineSourceRanges);
  }
  decorateInlineSyntax(
    view,
    ranges,
    syntaxHiddenRanges,
    activeInlineSourceRanges,
  );

  for (const visibleRange of view.visibleRanges) {
    let line = view.state.doc.lineAt(visibleRange.from);
    while (line.from <= visibleRange.to) {
      const fencedCodeLineClass = fencedCodeLineClasses.get(line.number);
      if (fencedCodeLineClass) {
        ranges.push(
          Decoration.line({ class: fencedCodeLineClass }).range(line.from),
        );
      }
      decorateHeadingLine(line.text, line.from, ranges);
      decorateFootnotes(line.text, line.from, ranges);
      if (replaceWidgets) {
        decorateListCallouts(
          line.text,
          line.from,
          ranges,
          view.state,
          listCalloutMatcher,
        );
        decorateTaskCheckboxes(
          line.text,
          line.from,
          ranges,
          options,
          view.state,
          activeInlineSourceRanges,
        );
      }
      decorateStrikethroughRanges(
        line.text,
        line.from,
        ranges,
        syntaxHiddenRanges,
        activeInlineSourceRanges,
        view.state,
      );
      const inlineMathRanges =
        replaceWidgets && !fencedCodeLineClass
          ? decorateInlineMath(
              line.text,
              line.from,
              ranges,
              options,
              view.state,
            )
          : [];
      const inlineMarkdownWidgetRanges =
        replaceWidgets && !fencedCodeLineClass
          ? decorateInlineMarkdownWidgets(
              line.text,
              line.from,
              ranges,
              options,
              view.state,
            )
          : [];
      if (!fencedCodeLineClass) {
        decorateHiddenFormatting(line.text, line.from, ranges, {
          excludedRanges: [
            ...inlineMathRanges,
            ...inlineMarkdownWidgetRanges,
            ...syntaxHiddenRanges,
            ...activeInlineSourceRanges,
          ],
          state: view.state,
        });
      }

      if (line.to >= visibleRange.to || line.number >= view.state.doc.lines) {
        break;
      }
      line = view.state.doc.line(line.number + 1);
    }
  }

  return Decoration.set(sortRanges(ranges), true);
}

class ListCalloutMarkerWidget extends WidgetType {
  constructor(private readonly callout: MiraResolvedListCallout) {
    super();
  }

  override toDOM(): HTMLElement {
    const span = document.createElement("span");
    span.className = "lc-list-marker";
    span.setAttribute("aria-hidden", "true");
    span.dataset.calloutChar = this.callout.char;
    if (this.callout.icon) {
      span.dataset.calloutIcon = this.callout.icon;
    }

    const cleanup = this.callout.renderMarker?.(span, this.callout);
    if (typeof cleanup === "function") {
      listCalloutMarkerCleanups.set(span, cleanup);
    } else if (!span.childNodes.length) {
      if (this.callout.icon === "book-open") {
        span.append(createBookOpenIcon());
      } else {
        span.textContent = this.callout.char;
      }
    }
    return span;
  }

  override eq(widget: ListCalloutMarkerWidget): boolean {
    return (
      widget.callout.char === this.callout.char &&
      widget.callout.color === this.callout.color &&
      widget.callout.icon === this.callout.icon &&
      widget.callout.renderMarker === this.callout.renderMarker
    );
  }

  override destroy(dom: HTMLElement): void {
    listCalloutMarkerCleanups.get(dom)?.();
    listCalloutMarkerCleanups.delete(dom);
  }
}

const listCalloutMarkerCleanups = new WeakMap<HTMLElement, () => void>();

class ListCalloutBackgroundWidget extends WidgetType {
  override toDOM(): HTMLElement {
    const span = document.createElement("span");
    span.className = "lc-list-bg";
    span.setAttribute("aria-hidden", "true");
    return span;
  }

  override eq(): boolean {
    return true;
  }
}

function decorateListCallouts(
  text: string,
  lineStart: number,
  ranges: Range<Decoration>[],
  state: EditorState,
  matchListCallout: ListCalloutMatcher,
): void {
  const markerRange = matchListCallout(text, lineStart);
  if (!markerRange) {
    return;
  }

  ranges.push(
    Decoration.line({
      class: "lc-list-callout",
      attributes: {
        "data-callout": markerRange.marker,
        style: `--lc-callout-color: ${markerRange.color}`,
      },
    }).range(lineStart),
  );

  ranges.push(
    Decoration.widget({
      side: -1,
      widget: new ListCalloutBackgroundWidget(),
    }).range(lineStart),
  );

  if (
    rangeIntersectsSelection(
      state,
      markerRange.markerStart,
      markerRange.markerEnd,
    )
  ) {
    return;
  }

  ranges.push(
    Decoration.replace({
      widget: new ListCalloutMarkerWidget(markerRange.callout),
    }).range(markerRange.markerStart, markerRange.markerEnd),
  );
}

function createBookOpenIcon(): SVGSVGElement {
  const namespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(namespace, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");

  for (const data of [
    "M12 7v14",
    "M3 18a1 1 0 0 1-1-1V5a2 2 0 0 1 2-2h5a3 3 0 0 1 3 3v15a3 3 0 0 0-3-3Z",
    "M21 18a1 1 0 0 0 1-1V5a2 2 0 0 0-2-2h-5a3 3 0 0 0-3 3v15a3 3 0 0 1 3-3Z",
  ]) {
    const path = document.createElementNS(namespace, "path");
    path.setAttribute("d", data);
    svg.append(path);
  }
  return svg;
}

function decorateInlineSyntax(
  view: EditorView,
  ranges: Range<Decoration>[],
  hiddenRanges: RangeBoundary[],
  activeSourceRanges: RangeBoundary[],
): void {
  const tree =
    ensureSyntaxTree(view.state, view.state.doc.length, 100) ??
    syntaxTree(view.state);

  for (const visibleRange of view.visibleRanges) {
    tree.iterate({
      from: visibleRange.from,
      to: visibleRange.to,
      enter(node) {
        const parent = node.node.parent;
        const parentName = parent?.name;
        const parentFrom = parent?.from ?? node.from;
        const parentTo = parent?.to ?? node.to;
        const nodeSource = view.state.sliceDoc(node.from, node.to);

        if (INLINE_SOURCE_TOKEN_NAMES.has(node.name)) {
          decorateInlineTokenElement(
            view,
            node.name,
            node.from,
            node.to,
            ranges,
          );
          if (rangeIntersectsSelection(view.state, node.from, node.to)) {
            activeSourceRanges.push({ from: node.from, to: node.to });
          }
        }

        decorateInlineTokenPart(
          view,
          node.name,
          node.from,
          node.to,
          nodeSource,
          parentName,
          ranges,
        );

        if (
          INLINE_FORMATTING_NODE_NAMES.has(node.name) &&
          !isBareExternalAutolinkUrl(node.name, parentName, nodeSource) &&
          !rangeIntersectsSelection(view.state, parentFrom, parentTo) &&
          !activeSourceRanges.some((range) =>
            rangesOverlap(range, { from: node.from, to: node.to }),
          )
        ) {
          hiddenRanges.push({ from: node.from, to: node.to });
          ranges.push(hiddenFormattingMark.range(node.from, node.to));
        }
      },
    });
  }
}

function collectActiveTaskMarkerRanges(
  view: EditorView,
  activeSourceRanges: RangeBoundary[],
): void {
  for (const visibleRange of view.visibleRanges) {
    let line = view.state.doc.lineAt(visibleRange.from);
    while (line.from <= visibleRange.to) {
      const taskRange = getTaskMarkerRange(line.text, line.from);
      if (
        taskRange &&
        selectionTouchesTaskMarker(view.state, line.from, taskRange.markerEnd)
      ) {
        activeSourceRanges.push({
          from: taskRange.markerStart,
          to: taskRange.markerEnd,
        });
      }

      if (line.to >= visibleRange.to || line.number >= view.state.doc.lines) {
        break;
      }
      line = view.state.doc.line(line.number + 1);
    }
  }
}

function decorateInlineMarkdownWidgets(
  text: string,
  lineStart: number,
  ranges: Range<Decoration>[],
  options: MiraRichEditorOptions,
  state: EditorState,
): RangeBoundary[] {
  const widgetRanges: RangeBoundary[] = [];
  const codeRanges = findInlineCodeRanges(text);

  if (isStandaloneEmbedLine(text) || isStandaloneMarkdownImageLine(text)) {
    widgetRanges.push({ from: lineStart, to: lineStart + text.length });
    return widgetRanges;
  }

  for (const match of text.matchAll(/!?\[\[[^\]\r\n]+\]\]/gu)) {
    const localFrom = match.index ?? 0;
    const localTo = localFrom + match[0].length;
    if (
      isPositionInsideRanges(localFrom, codeRanges) ||
      isPositionInsideRanges(localTo - 1, codeRanges)
    ) {
      continue;
    }

    const from = lineStart + localFrom;
    const to = lineStart + localTo;
    if (rangeContainsSelectionCursor(state, from, to)) {
      continue;
    }

    widgetRanges.push({ from, to });
    ranges.push(
      Decoration.replace({
        widget: new InlineMarkdownWidget({
          from,
          to,
          markdown: match[0],
          options,
        }),
      }).range(from, to),
    );
  }

  for (const image of findMarkdownImageRanges(text, state.doc.toString())) {
    const from = lineStart + image.from;
    const to = lineStart + image.to;
    if (
      rangeContainsSelectionCursor(state, from, to) ||
      widgetRanges.some((range) => rangesOverlap(range, { from, to }))
    ) {
      continue;
    }

    widgetRanges.push({ from, to });
    ranges.push(
      Decoration.replace({
        widget: new InlineMarkdownWidget({
          from,
          to,
          markdown: image.source,
          options,
        }),
      }).range(from, to),
    );
  }

  return widgetRanges;
}

function isStandaloneEmbedLine(text: string): boolean {
  return /^\s*!\[\[[^\]\r\n]+\]\]\s*$/u.test(text);
}

function decorateInlineTokenElement(
  view: EditorView,
  name: string,
  from: number,
  to: number,
  ranges: Range<Decoration>[],
): void {
  if (name === "StrongEmphasis") {
    ranges.push(strongMark.range(from, to));
    return;
  }
  if (name === "Emphasis") {
    ranges.push(emphasisMark.range(from, to));
    return;
  }
  if (name === "Strikethrough" || name === "StrikethroughEmphasis") {
    ranges.push(strikethroughMark.range(from, to));
    return;
  }
  if (name === "InlineCode" || name === "CodeBlock") {
    ranges.push(inlineCodeMark.range(from, to));
    return;
  }
  if (name === "Link" || name === "PathLink") {
    const source = view.state.sliceDoc(from, to);
    ranges.push(
      (isExternalMarkdownLink(source)
        ? externalLinkMark
        : internalLinkMark
      ).range(from, to),
    );
    const textRange = getMarkdownLinkTextRange(source, from, to);
    if (textRange) {
      ranges.push(linkTextMark.range(textRange.from, textRange.to));
    }
    return;
  }
  if (name === "WikiLink" || name === "EmbedLink" || name === "Image") {
    ranges.push(internalLinkMark.range(from, to));
  }
}

function decorateInlineTokenPart(
  view: EditorView,
  name: string,
  from: number,
  to: number,
  source: string,
  parentName: string | undefined,
  ranges: Range<Decoration>[],
): void {
  if (name === "URL") {
    ranges.push(
      (parentName === "Link" ? linkTargetMark : externalLinkMark).range(
        from,
        to,
      ),
    );
    if (parentName !== "Link" && isExternalMarkdownLink(source)) {
      const textRange = getMarkdownLinkTextRange(source, from, to);
      if (textRange) {
        ranges.push(linkTextMark.range(textRange.from, textRange.to));
      }
    }
    return;
  }
  if (name === "PathLinkDestination") {
    ranges.push(linkPathTargetMark.range(from, to));
    return;
  }
  if (
    name === "WikiLinkPath" ||
    name === "WikiLinkAnchor" ||
    name === "EmbedLinkPath" ||
    name === "EmbedLinkAnchor"
  ) {
    ranges.push(linkTargetMark.range(from, to));
    return;
  }
  if (name === "WikiLinkText" || name === "EmbedLinkText") {
    ranges.push(linkTextMark.range(from, to));
  }
}

function decorateStrikethroughRanges(
  text: string,
  lineStart: number,
  ranges: Range<Decoration>[],
  hiddenRanges: RangeBoundary[],
  activeSourceRanges: RangeBoundary[],
  state: EditorState,
): void {
  for (const match of text.matchAll(/~~(?=\S)(.+?)(?<=\S)~~/gu)) {
    const from = lineStart + (match.index ?? 0);
    const to = from + match[0].length;
    const opening = { from, to: from + 2 };
    const closing = { from: to - 2, to };

    ranges.push(strikethroughMark.range(from, to));
    if (rangeIntersectsSelection(state, from, to)) {
      activeSourceRanges.push({ from, to });
      continue;
    }

    hiddenRanges.push(opening, closing);
    ranges.push(hiddenFormattingMark.range(opening.from, opening.to));
    ranges.push(hiddenFormattingMark.range(closing.from, closing.to));
  }
}

function getFencedCodeLineClasses(state: EditorState): Map<number, string> {
  const classes = new Map<number, string>();
  const tree =
    ensureSyntaxTree(state, state.doc.length, 100) ?? syntaxTree(state);

  tree.iterate({
    from: 0,
    to: state.doc.length,
    enter(node) {
      if (node.name !== "FencedCode") {
        return;
      }

      const start = state.doc.lineAt(node.from);
      const end = state.doc.lineAt(node.to);
      const markdown = state.doc.sliceString(start.from, end.to);
      const language = getFencedCodeLanguage(markdown);
      const isTextCode = language === "text";

      for (
        let lineNumber = start.number;
        lineNumber <= end.number;
        lineNumber += 1
      ) {
        const classNames = ["cm-formatting-code"];
        if (isTextCode) {
          classNames.push("cm-formatting-code-language-text");
        }
        if (lineNumber === start.number) {
          classNames.push("cm-formatting-code-start");
        }
        if (lineNumber === end.number) {
          classNames.push("cm-formatting-code-end");
        }
        classes.set(lineNumber, classNames.join(" "));
      }
    },
  });

  return classes;
}

function decorateTaskCheckboxes(
  text: string,
  lineStart: number,
  ranges: Range<Decoration>[],
  options: MiraRichEditorOptions,
  state: EditorState,
  activeSourceRanges: RangeBoundary[],
): void {
  const taskRange = getTaskMarkerRange(text, lineStart);
  if (taskRange) {
    ranges.push(
      Decoration.line({
        class: "cm-task-line HyperMD-task-line",
        attributes: {
          "data-task": taskRange.taskValue,
        },
      }).range(lineStart),
    );
    if (selectionTouchesTaskMarker(state, lineStart, taskRange.markerEnd)) {
      activeSourceRanges.push({
        from: taskRange.markerStart,
        to: taskRange.markerEnd,
      });
      return;
    }
    ranges.push(
      Decoration.replace({
        widget: new TaskCheckboxWidget({
          from: taskRange.checkboxStart,
          value: taskRange.taskValue,
          checked: taskRange.taskValue.trim().length > 0,
          options,
        }),
      }).range(taskRange.markerStart, taskRange.checkboxEnd),
    );
  }
}

function decorateFootnotes(
  text: string,
  lineStart: number,
  ranges: Range<Decoration>[],
): void {
  const definition = text.match(/^\[\^([^\]\r\n]+)\]:/u);
  if (definition) {
    ranges.push(
      Decoration.line({
        class: "cm-footnote cm-footnote-definition",
      }).range(lineStart),
    );
  }

  for (const match of text.matchAll(/\[\^([^\]\r\n]+)\]/gu)) {
    const from = lineStart + (match.index ?? 0);
    ranges.push(
      Decoration.mark({
        class: "cm-footnote cm-footnote-ref",
      }).range(from, from + match[0].length),
    );
  }
}

function decorateInlineMath(
  text: string,
  lineStart: number,
  ranges: Range<Decoration>[],
  options: MiraRichEditorOptions,
  state: EditorState,
): RangeBoundary[] {
  const mathRanges = findInlineMathRanges(text);
  const absoluteRanges: RangeBoundary[] = [];

  for (const range of mathRanges) {
    const from = lineStart + range.from;
    const to = lineStart + range.to;
    absoluteRanges.push({ from, to });
    const widget = new InlineMathWidget({
      from,
      to,
      source: range.source,
      options,
    });
    if (rangeIntersectsSelection(state, from, to)) {
      ranges.push(
        Decoration.widget({
          side: 1,
          widget,
        }).range(to),
      );
    } else {
      ranges.push(
        Decoration.replace({
          widget,
        }).range(from, to),
      );
    }
  }

  return absoluteRanges;
}

const headingLineDecorations = Array.from({ length: 6 }, (_, index) =>
  Decoration.line({
    class: [
      "cm-header",
      "HyperMD-header",
      `cm-header-${index + 1}`,
      `HyperMD-header-${index + 1}`,
    ].join(" "),
  }),
);

function decorateHeadingLine(
  text: string,
  lineStart: number,
  ranges: Range<Decoration>[],
): void {
  const match = text.match(/^(#{1,6})(?=\s)/);
  if (!match?.[1]) {
    return;
  }
  ranges.push(headingLineDecorations[match[1].length - 1]!.range(lineStart));
}

function decorateHiddenFormatting(
  text: string,
  lineStart: number,
  ranges: Range<Decoration>[],
  options: {
    excludedRanges?: RangeBoundary[];
    state?: EditorState;
  } = {},
): void {
  addRegexMarks(text, lineStart, ranges, /(\*\*|__|\*|_|~~|`)/g, options);
  addRegexMarks(text, lineStart, ranges, /(!?\[|\]\(|\)|\[\[|\]\])/g, options);
  decorateHeadingFormatting(text, lineStart, ranges, options);
  addRegexMarks(text, lineStart, ranges, /^(\s*>+\s?)/g, options);
}

function decorateHeadingFormatting(
  text: string,
  lineStart: number,
  ranges: Range<Decoration>[],
  options: {
    excludedRanges?: RangeBoundary[];
    state?: EditorState;
  },
): void {
  const markerRange = getAtxHeadingMarkerRange(text, lineStart);
  if (
    !markerRange ||
    options.excludedRanges?.some((range) =>
      rangesOverlap(range, markerRange),
    ) ||
    (options.state &&
      selectionTouchesLine(options.state, lineStart, lineStart + text.length))
  ) {
    return;
  }

  ranges.push(hiddenFormattingMark.range(markerRange.from, markerRange.to));
}

function addRegexMarks(
  text: string,
  lineStart: number,
  ranges: Range<Decoration>[],
  regexp: RegExp,
  options: {
    excludedRanges?: RangeBoundary[];
    state?: EditorState;
  } = {},
): void {
  for (const match of text.matchAll(regexp)) {
    const token = match[1] ?? match[0];
    const start = lineStart + (match.index ?? 0);
    const tokenStart = match[0].indexOf(token);
    const from = start + Math.max(0, tokenStart);
    const to = from + token.length;
    if (
      options.excludedRanges?.some((range) =>
        rangesOverlap(range, { from, to }),
      ) ||
      (options.state && rangeIntersectsSelection(options.state, from, to))
    ) {
      continue;
    }
    ranges.push(hiddenFormattingMark.range(from, to));
  }
}
