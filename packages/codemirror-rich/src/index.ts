import {
  foldEffect,
  foldedRanges,
  foldable,
  ensureSyntaxTree,
  syntaxTree,
  unfoldEffect,
} from "@codemirror/language";
import {
  EditorState,
  RangeSet,
  RangeSetBuilder,
  StateField,
  type Extension,
  type Range,
} from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  GutterMarker,
  gutterLineClass,
  type PluginValue,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import type {
  MiraAssetResolver,
  MiraExtension,
  MiraLinkResolver,
} from "@mira-mde/extensions";
import { MarkdownPreview } from "@mira-mde/preview";
import { createMarkdownTableWidget } from "@mira-mde/codemirror-tables";
import { mount, unmount } from "svelte";

export type MiraRichEditorOptions = {
  enabled?: boolean;
  livePreview?: boolean;
  extensions?: MiraExtension[];
  sourcePath?: string;
  linkResolver?: MiraLinkResolver;
  assetResolver?: MiraAssetResolver;
  frontmatterOpen?: boolean;
  onChange?: (
    replacement: string,
    from: number,
    to: number,
    nextValue: string,
  ) => void;
  onFrontmatterChange?: (nextYaml: string, nextValue: string) => void;
};

type RangeBoundary = {
  from: number;
  to: number;
};

const BLOCK_WIDGET_NODE_NAMES = new Set([
  "Frontmatter",
  "FencedCode",
  "BlockMathDollar",
  "BlockMathBracket",
  "Blockquote",
  "Table",
  "GridTable",
  "LeafDirective",
  "ContainerDirective",
]);

const blockWidgetMounts = new WeakMap<HTMLElement, Record<string, unknown>>();

const hiddenFormattingMark = Decoration.mark({
  class: "cm-formatting cm-formatting-hidden",
});

const RICH_BLOCK_LINE_HEIGHT_ESTIMATE_PX = 25.5;
const RICH_BLOCK_VERTICAL_PADDING_ESTIMATE_PX = 16;
const RICH_MERMAID_WIDGET_MIN_HEIGHT_PX = 200;
const RICH_TABLE_ROW_HEIGHT_ESTIMATE_PX = 48;
const RICH_TABLE_WRAP_COLUMN_ESTIMATE_CHARS = 72;
const RICH_TABLE_WRAPPED_ROW_EXTRA_HEIGHT_PX = 40;

export function createRichEditorExtensions(
  options: MiraRichEditorOptions = {},
): Extension[] {
  if (options.enabled === false) {
    return [];
  }

  const livePreview = options.livePreview ?? true;

  return [
    miraRichEditorTheme,
    headingGutterExtension(),
    livePreview ? blockPreviewDecorations(options) : [],
    livePreview ? inlinePreviewDecorations(options) : [],
    foldIndicatorDecorations(),
    livePreview
      ? EditorView.editorAttributes.of({
          class:
            "mira-mde-live-preview-mode markdown-live-preview-mode markdown-live-preview-view cm-live-preview",
        })
      : [],
  ];
}

export const PREVIEW_INTERACTIVE_SELECTOR = [
  "button",
  "input",
  "select",
  "textarea",
  "summary",
  "details",
  "audio",
  "video",
  "[contenteditable='true']",
  "[role='button']",
  "[role='checkbox']",
  "[role='textbox']",
  "[data-editable-markdown-ignore-click]",
].join(", ");

export function shouldActivateEditablePreview(event: MouseEvent): boolean {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return false;
  }

  const target = event.target instanceof Element ? event.target : null;
  return !target?.closest(PREVIEW_INTERACTIVE_SELECTOR);
}

export function getFencedCodeLanguage(markdown: string): string {
  const match = markdown.match(/^(```|~~~)\s*([^\s`]*)/);
  return match?.[2]?.trim() ?? "";
}

export function getFencedCodeWidgetRange(
  markdown: string,
): RangeBoundary | null {
  const opening = markdown.match(/^(```|~~~)[^\n]*(?:\n|$)/);
  if (!opening) {
    return null;
  }

  const fence = opening[1] ?? "";
  if (!fence) {
    return null;
  }
  const closingIndex = markdown.lastIndexOf(`\n${fence}`);
  if (closingIndex <= 0) {
    return {
      from: 0,
      to: markdown.length,
    };
  }

  return {
    from: 0,
    to: closingIndex + fence.length + 1,
  };
}

export function estimateMarkdownBlockHeight(markdown: string): number {
  const lineCount = countSourceLines(markdown);
  const trimmed = markdown.trimStart();
  const fencedCode = trimmed.match(/^(```|~~~)([^\r\n]*)/);

  if (fencedCode) {
    const language = fencedCode[2]?.trim().toLowerCase() ?? "";
    const bodyLineCount = Math.max(1, lineCount - 2);
    const baseHeight =
      bodyLineCount * RICH_BLOCK_LINE_HEIGHT_ESTIMATE_PX +
      RICH_BLOCK_VERTICAL_PADDING_ESTIMATE_PX * 2;

    if (language === "mermaid") {
      return Math.max(RICH_MERMAID_WIDGET_MIN_HEIGHT_PX, baseHeight);
    }

    return Math.max(64, baseHeight);
  }

  if (isPipeTableMarkdown(markdown)) {
    return estimateTableWidgetHeight(markdown);
  }

  if (/^\s*---(?:\r?\n|$)/.test(markdown)) {
    return Math.max(
      64,
      lineCount * RICH_BLOCK_LINE_HEIGHT_ESTIMATE_PX +
        RICH_BLOCK_VERTICAL_PADDING_ESTIMATE_PX,
    );
  }

  return Math.max(
    RICH_BLOCK_LINE_HEIGHT_ESTIMATE_PX,
    lineCount * RICH_BLOCK_LINE_HEIGHT_ESTIMATE_PX +
      RICH_BLOCK_VERTICAL_PADDING_ESTIMATE_PX,
  );
}

function countSourceLines(source: string): number {
  if (!source) {
    return 1;
  }

  return source.split(/\r\n|\r|\n/).length;
}

function isPipeTableMarkdown(markdown: string): boolean {
  const lines = markdown
    .trim()
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.length >= 2 && isTableSeparatorLine(lines[1] ?? "");
}

function isTableSeparatorLine(line: string): boolean {
  const cells = line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim())
    .filter(Boolean);

  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function estimateTableWidgetHeight(source: string): number {
  let height = 0;
  let measuredRows = 0;

  for (const line of source.split(/\r\n|\r|\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    measuredRows += 1;
    if (isTableSeparatorLine(trimmed)) {
      continue;
    }

    const cells = trimmed
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());
    const longestCellLength = Math.max(0, ...cells.map((cell) => cell.length));
    const wrappedLines = Math.max(
      1,
      Math.ceil(longestCellLength / RICH_TABLE_WRAP_COLUMN_ESTIMATE_CHARS),
    );

    height +=
      RICH_TABLE_ROW_HEIGHT_ESTIMATE_PX +
      (wrappedLines - 1) * RICH_TABLE_WRAPPED_ROW_EXTRA_HEIGHT_PX;
  }

  return Math.max(
    RICH_TABLE_ROW_HEIGHT_ESTIMATE_PX,
    height || measuredRows * RICH_TABLE_ROW_HEIGHT_ESTIMATE_PX,
  );
}

class HeadingGutterMarker extends GutterMarker {
  override readonly elementClass: string;

  constructor(readonly level: number) {
    super();
    this.elementClass = `cm-gutterHeader cm-gutterHeader-${level}`;
  }

  override eq(other: GutterMarker): boolean {
    return other instanceof HeadingGutterMarker && other.level === this.level;
  }
}

function headingGutterExtension(): Extension {
  return StateField.define<RangeSet<GutterMarker>>({
    create(state) {
      return createHeadingGutterMarkers(state);
    },
    update(markers, transaction) {
      if (transaction.docChanged) {
        return createHeadingGutterMarkers(transaction.state);
      }
      return markers;
    },
    provide: (field) => gutterLineClass.from(field),
  });
}

function createHeadingGutterMarkers(
  state: EditorState,
): RangeSet<GutterMarker> {
  const markers: Range<GutterMarker>[] = [];

  for (let index = 1; index <= state.doc.lines; index += 1) {
    const line = state.doc.line(index);
    const level = getHeadingLevel(line.text);
    if (level !== null) {
      markers.push(new HeadingGutterMarker(level).range(line.from));
    }
  }

  return RangeSet.of(markers);
}

function getHeadingLevel(text: string): number | null {
  const headingMatch = text.match(/^(#{1,6})\s/);
  return headingMatch?.[1]?.length ?? null;
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

function foldIndicatorDecorations(): Extension {
  return ViewPlugin.fromClass(FoldIndicatorPlugin, {
    decorations: (value) => value.decorations,
  });
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
          ? rangeIntersectsSelection(state, from, to) &&
            !hasInitialFrontmatterCursor(state, from)
          : rangeIntersectsSelection(state, from, to);

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

  return Decoration.set(sortRanges(ranges), true);
}

function buildInlinePreviewDecorations(
  view: EditorView,
  options: MiraRichEditorOptions,
): DecorationSet {
  const ranges: Range<Decoration>[] = [];
  const fencedCodeLineClasses = getFencedCodeLineClasses(view.state);
  const activeLines = new Set(
    view.state.selection.ranges.map(
      (selection) => view.state.doc.lineAt(selection.head).number,
    ),
  );

  for (const visibleRange of view.visibleRanges) {
    let line = view.state.doc.lineAt(visibleRange.from);
    while (line.from <= visibleRange.to) {
      const isActiveLine = activeLines.has(line.number);
      const fencedCodeLineClass = fencedCodeLineClasses.get(line.number);
      if (fencedCodeLineClass) {
        ranges.push(
          Decoration.line({ class: fencedCodeLineClass }).range(line.from),
        );
      }
      decorateHeadingLine(line.text, line.from, ranges);
      decorateTaskCheckboxes(line.text, line.from, ranges, options);
      if (!isActiveLine && !fencedCodeLineClass) {
        decorateHiddenFormatting(line.text, line.from, ranges);
      }

      if (line.to >= visibleRange.to || line.number >= view.state.doc.lines) {
        break;
      }
      line = view.state.doc.line(line.number + 1);
    }
  }

  return Decoration.set(sortRanges(ranges), true);
}

function getFencedCodeLineClasses(state: EditorState): Map<number, string> {
  const classes = new Map<number, string>();
  const tree = ensureSyntaxTree(state, state.doc.length, 100) ?? syntaxTree(state);

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

class BlockPreviewWidget extends WidgetType {
  constructor(
    private readonly config: {
      from: number;
      to: number;
      markdown: string;
      nodeName: string;
      options: MiraRichEditorOptions;
    },
  ) {
    super();
  }

  override eq(other: BlockPreviewWidget): boolean {
    return (
      this.config.from === other.config.from &&
      this.config.to === other.config.to &&
      this.config.markdown === other.config.markdown &&
      this.config.nodeName === other.config.nodeName &&
      this.config.options.frontmatterOpen ===
        other.config.options.frontmatterOpen
    );
  }

  override get estimatedHeight(): number {
    return estimateMarkdownBlockHeight(this.config.markdown);
  }

  override toDOM(view: EditorView): HTMLElement {
    const container = document.createElement("div");
    container.className = [
      "mira-rich-widget",
      "mira-rich-widget--block",
      `mira-rich-widget--${this.config.nodeName.toLowerCase()}`,
      "markdown-rendered",
    ].join(" ");
    container.dataset.node = this.config.nodeName;

    if (this.config.nodeName === "Table") {
      container.append(
        createMarkdownTableWidget({
          markdown: this.config.markdown,
          onChange: (nextMarkdown) => {
            this.dispatchMarkdownReplacement(view, nextMarkdown);
          },
          onDelete: () => {
            this.dispatchMarkdownReplacement(view, "");
          },
          onSource: () => {
            selectWidgetSource(view, this.config.from, this.config.to);
          },
        }),
      );
      return container;
    }

    container.append(
      createSourceToggleButton(() => {
        selectWidgetSource(view, this.config.from, this.config.to);
      }),
    );

    let pendingFrontmatterValue = "";
    const component = mount(MarkdownPreview, {
      target: container,
      props: {
        value: this.config.markdown,
        embed: true,
        sourcePath: this.config.options.sourcePath,
        extensions: this.config.options.extensions ?? [],
        linkResolver: this.config.options.linkResolver,
        assetResolver: this.config.options.assetResolver,
        frontmatterOpen: this.config.options.frontmatterOpen ?? true,
        onChange: (replacement: string, from: number, to: number) => {
          const absoluteFrom = this.config.from + from;
          const absoluteTo = this.config.from + to;
          const nextValue = [
            view.state.doc.sliceString(0, absoluteFrom),
            replacement,
            view.state.doc.sliceString(absoluteTo),
          ].join("");
          pendingFrontmatterValue = nextValue;
          this.config.options.onChange?.(
            replacement,
            absoluteFrom,
            absoluteTo,
            nextValue,
          );
        },
        onFrontmatterChange: (nextYaml: string) => {
          this.config.options.onFrontmatterChange?.(
            nextYaml,
            pendingFrontmatterValue || view.state.doc.toString(),
          );
        },
      },
    });
    blockWidgetMounts.set(container, component as Record<string, unknown>);

    container.addEventListener("mousedown", (event) => {
      if (!shouldActivateEditablePreview(event)) {
        return;
      }

      event.preventDefault();
      view.dispatch({
        selection: { anchor: this.config.from, head: this.config.to },
        scrollIntoView: true,
      });
      view.focus();
    });

    return container;
  }

  private dispatchMarkdownReplacement(
    view: EditorView,
    replacement: string,
  ): void {
    const nextValue = [
      view.state.doc.sliceString(0, this.config.from),
      replacement,
      view.state.doc.sliceString(this.config.to),
    ].join("");
    this.config.options.onChange?.(
      replacement,
      this.config.from,
      this.config.to,
      nextValue,
    );
    view.dispatch({
      changes: {
        from: this.config.from,
        to: this.config.to,
        insert: replacement,
      },
      selection: {
        anchor: this.config.from,
        head: this.config.from + replacement.length,
      },
      scrollIntoView: true,
    });
  }

  override destroy(dom: HTMLElement): void {
    const component = blockWidgetMounts.get(dom);
    if (component) {
      void unmount(component);
      blockWidgetMounts.delete(dom);
    }
  }

  override ignoreEvent(): boolean {
    return true;
  }
}

class TaskCheckboxWidget extends WidgetType {
  constructor(
    private readonly config: {
      from: number;
      checked: boolean;
      options: MiraRichEditorOptions;
    },
  ) {
    super();
  }

  override eq(other: TaskCheckboxWidget): boolean {
    return (
      this.config.from === other.config.from &&
      this.config.checked === other.config.checked
    );
  }

  override toDOM(view: EditorView): HTMLElement {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = "mira-task-checkbox cm-task-checkbox";
    input.checked = this.config.checked;
    input.setAttribute("aria-label", "Toggle task");
    input.addEventListener("change", () => {
      const replacement = input.checked ? "x" : " ";
      view.dispatch({
        changes: {
          from: this.config.from + 1,
          to: this.config.from + 2,
          insert: replacement,
        },
      });
    });
    return input;
  }

  override ignoreEvent(): boolean {
    return true;
  }
}

class FoldIndicatorPlugin implements PluginValue {
  decorations: DecorationSet;

  constructor(private readonly view: EditorView) {
    this.decorations = buildFoldIndicatorDecorations(view);
  }

  update(update: ViewUpdate): void {
    if (
      update.docChanged ||
      update.selectionSet ||
      update.viewportChanged ||
      update.geometryChanged
    ) {
      this.decorations = buildFoldIndicatorDecorations(update.view);
    }
  }
}

class FoldIndicatorWidget extends WidgetType {
  constructor(
    private readonly config: {
      range: RangeBoundary;
      folded: boolean;
    },
  ) {
    super();
  }

  override eq(other: FoldIndicatorWidget): boolean {
    return (
      this.config.range.from === other.config.range.from &&
      this.config.range.to === other.config.range.to &&
      this.config.folded === other.config.folded
    );
  }

  override toDOM(view: EditorView): HTMLElement {
    const wrapper = document.createElement("span");
    wrapper.className = "cm-fold-indicator relative";

    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "hover:bg-transparent p-0 collapse-indicator flex size-4 min-h-0 min-w-0 items-center justify-center collapse-icon closed-fold-icon";
    button.dataset.folded = String(this.config.folded);
    button.setAttribute(
      "aria-label",
      this.config.folded ? "Expand section" : "Collapse section",
    );

    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.classList.add("svg-icon");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "2");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    if (this.config.folded) {
      icon.style.transform = "rotate(-90deg)";
    }
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M3 8L12 17L21 8");
    icon.append(path);
    button.append(icon);

    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      view.dispatch({
        effects: this.config.folded
          ? unfoldEffect.of(this.config.range)
          : foldEffect.of(this.config.range),
      });
      view.focus();
    });

    wrapper.append(button);
    return wrapper;
  }

  override ignoreEvent(): boolean {
    return true;
  }
}

function buildFoldIndicatorDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();

  for (const visibleRange of view.visibleRanges) {
    let line = view.state.doc.lineAt(visibleRange.from);
    while (line.from <= visibleRange.to) {
      const foldRange = foldable(view.state, line.from, line.to);
      if (foldRange) {
        const folded = isRangeFolded(view, foldRange);
        const anchor = getFoldAnchor({
          from: line.from,
          text: line.text,
        });
        builder.add(
          anchor,
          anchor,
          Decoration.widget({
            side: -1,
            widget: new FoldIndicatorWidget({
              range: foldRange,
              folded,
            }),
          }),
        );
      }

      if (line.to >= visibleRange.to || line.number >= view.state.doc.lines) {
        break;
      }
      line = view.state.doc.line(line.number + 1);
    }
  }

  return builder.finish();
}

export function getFoldAnchor(line: { from: number; text: string }): number {
  const contentOffset = line.text.search(/\S/);
  return contentOffset > 0 ? line.from + contentOffset : line.from;
}

function isRangeFolded(view: EditorView, range: RangeBoundary): boolean {
  let folded = false;
  foldedRanges(view.state).between(range.from, range.to, (from, to) => {
    if (from === range.from && to === range.to) {
      folded = true;
    }
  });
  return folded;
}

function decorateTaskCheckboxes(
  text: string,
  lineStart: number,
  ranges: Range<Decoration>[],
  options: MiraRichEditorOptions,
): void {
  const match = text.match(/^(\s*)((?:[-*+]|\d+[.)])\s+)\[([ xX])]\s/);
  if (match && match[1] !== undefined && match[2] !== undefined) {
    const markerStart = lineStart + match[1].length;
    const checkboxStart = markerStart + match[2].length;
    const checkboxEnd = checkboxStart + 3;
    const taskValue = match[3] ?? " ";
    ranges.push(
      Decoration.line({
        class: "cm-task-line HyperMD-task-line",
        attributes: {
          "data-task": taskValue.trim().toLowerCase(),
        },
      }).range(lineStart),
    );
    ranges.push(
      Decoration.replace({
        widget: new TaskCheckboxWidget({
          from: checkboxStart,
          checked: taskValue.toLowerCase() === "x",
          options,
        }),
      }).range(markerStart, checkboxEnd),
    );
  }
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

function createSourceToggleButton(onClick: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className =
    "mira-rich-widget__source-toggle markdown-widget-select-control";
  button.title = "Edit source";
  button.setAttribute("aria-label", "Edit source");
  button.append(createCodeXmlIcon());
  button.addEventListener("mousedown", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  });
  return button;
}

function createCodeXmlIcon(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.classList.add("mira-rich-widget__source-icon", "svg-icon");
  appendSvgPath(svg, "m18 16 4-4-4-4");
  appendSvgPath(svg, "m6 8-4 4 4 4");
  appendSvgPath(svg, "m14.5 4-5 16");
  return svg;
}

function appendSvgPath(svg: SVGSVGElement, d: string): void {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  svg.append(path);
}

function selectWidgetSource(view: EditorView, from: number, to: number): void {
  view.dispatch({
    selection: { anchor: from, head: to },
    scrollIntoView: true,
  });
  view.focus();
}

function decorateHiddenFormatting(
  text: string,
  lineStart: number,
  ranges: Range<Decoration>[],
): void {
  addRegexMarks(text, lineStart, ranges, /(\*\*|__|\*|_|~~|`)/g);
  addRegexMarks(text, lineStart, ranges, /(!?\[|\]\(|\)|\[\[|]])/g);
  addRegexMarks(text, lineStart, ranges, /^(#{1,6})(?=\s)/g);
  addRegexMarks(text, lineStart, ranges, /^(\s*>+\s?)/g);
}

function addRegexMarks(
  text: string,
  lineStart: number,
  ranges: Range<Decoration>[],
  regexp: RegExp,
): void {
  for (const match of text.matchAll(regexp)) {
    const token = match[1] ?? match[0];
    const start = lineStart + (match.index ?? 0);
    const tokenStart = match[0].indexOf(token);
    const from = start + Math.max(0, tokenStart);
    ranges.push(hiddenFormattingMark.range(from, from + token.length));
  }
}

function rangeIntersectsSelection(
  state: EditorState,
  from: number,
  to: number,
): boolean {
  return state.selection.ranges.some(
    (selection) => selection.from <= to && selection.to >= from,
  );
}

function hasInitialFrontmatterCursor(
  state: EditorState,
  from: number,
): boolean {
  return (
    from === 0 &&
    state.selection.ranges.length === 1 &&
    state.selection.main.empty &&
    state.selection.main.from === 0
  );
}

function rangesOverlap(left: RangeBoundary, right: RangeBoundary): boolean {
  return left.from < right.to && right.from < left.to;
}

function sortRanges(ranges: Range<Decoration>[]): Range<Decoration>[] {
  return ranges.sort((left, right) => {
    if (left.from !== right.from) {
      return left.from - right.from;
    }
    return left.to - right.to;
  });
}

const miraRichEditorTheme = EditorView.theme({
  ".cm-foldGutter": {
    display: "none",
  },
  ".cm-line": {
    position: "relative",
  },
  ".mira-fold-indicator": {
    alignItems: "center",
    display: "inline-flex",
    height: "1rem",
    justifyContent: "center",
    marginInlineEnd: "0.15rem",
    marginInlineStart: "-1.15rem",
    position: "relative",
    verticalAlign: "-0.1rem",
    width: "1rem",
  },
  ".mira-fold-indicator__button": {
    alignItems: "center",
    background: "transparent",
    border: "0",
    borderRadius: "4px",
    color: "var(--mira-muted-foreground)",
    cursor: "pointer",
    display: "inline-flex",
    height: "1rem",
    justifyContent: "center",
    padding: "0",
    width: "1rem",
  },
  ".mira-fold-indicator__button:hover": {
    background: "var(--mira-accent-soft)",
    color: "var(--mira-foreground)",
  },
  ".mira-fold-indicator__icon": {
    display: "block",
    height: "0.875rem",
    transform: "rotate(0deg)",
    transition: "transform 120ms ease",
    width: "0.875rem",
  },
  ".mira-fold-indicator__button[data-folded='true'] .mira-fold-indicator__icon":
    {
      transform: "rotate(-90deg)",
    },
  ".cm-formatting-hidden": {
    color: "transparent",
    display: "inline-block",
    overflow: "hidden",
    width: "0",
  },
  ".mira-rich-widget": {
    background: "var(--mira-widget-background, transparent)",
    boxSizing: "border-box",
    color: "var(--mira-foreground)",
    margin: "0",
    overflow: "visible",
    position: "relative",
  },
  ".mira-rich-widget__source-toggle": {
    alignItems: "center",
    background: "var(--mira-popover)",
    border: "1px solid var(--mira-border)",
    borderRadius: "4px",
    boxShadow: "var(--mira-widget-shadow)",
    color: "var(--mira-muted-foreground)",
    cursor: "pointer",
    display: "inline-flex",
    height: "1.5rem",
    insetBlockStart: "0.25rem",
    insetInlineEnd: "0.25rem",
    justifyContent: "center",
    lineHeight: "1",
    opacity: "0",
    padding: "0",
    position: "absolute",
    transition: "opacity 120ms ease, color 120ms ease",
    width: "1.5rem",
    zIndex: "10",
  },
  ".mira-rich-widget__source-icon": {
    height: "0.95rem",
    width: "0.95rem",
  },
  ".mira-rich-widget:hover .mira-rich-widget__source-toggle, .mira-rich-widget:focus-within .mira-rich-widget__source-toggle":
    {
      opacity: "1",
    },
  ".mira-rich-widget__source-toggle:hover": {
    background: "var(--mira-accent-soft)",
    color: "var(--mira-foreground)",
  },
  ".mira-table-widget-shell": {
    display: "inline-block",
    maxWidth: "100%",
    position: "relative",
  },
  ".mira-table-widget-shell .cm-table-widget": {
    height: "1px !important",
    maxWidth: "100%",
    width: "fit-content !important",
  },
  ".mira-table-widget-shell .cm-table-widget tr": {
    height: "auto",
  },
  ".mira-table-widget-shell .cm-table-widget tr, .mira-table-widget-shell .cm-table-widget th, .mira-table-widget-shell .cm-table-widget td":
    {
      height: "2.5rem !important",
    },
  ".mira-table-widget-shell .cm-table-widget th, .mira-table-widget-shell .cm-table-widget td":
    {
      padding: "0 !important",
    },
  ".mira-table-widget-shell .cm-table-widget .table-cell-wrapper, .mira-table-widget-shell .cm-table-widget .table-cell-wrapper > button":
    {
      height: "auto !important",
      minHeight: "2.5rem",
    },
  ".mira-table-widget-shell .cm-editor.mod-inline, .mira-table-widget-shell .cm-editor.mod-inline .cm-scroller, .mira-table-widget-shell .cm-editor.mod-inline .cm-content":
    {
      background: "transparent !important",
      height: "auto !important",
      minHeight: "0 !important",
    },
  ".mira-table-widget-shell .cm-editor.mod-inline .cm-content": {
    padding: "0 !important",
  },
  ".mira-table-widget-shell .cm-editor.mod-inline .cm-content p": {
    margin: "0 !important",
  },
  ".mira-table-widget__source-toggle": {
    alignItems: "center",
    background: "var(--mira-popover)",
    border: "1px solid var(--mira-border)",
    borderRadius: "4px",
    boxShadow: "var(--mira-widget-shadow)",
    color: "var(--mira-muted-foreground)",
    cursor: "pointer",
    display: "inline-flex",
    height: "1.5rem",
    insetBlockStart: "0.25rem",
    insetInlineEnd: "0.25rem",
    justifyContent: "center",
    lineHeight: "1",
    opacity: "0",
    padding: "0",
    position: "absolute",
    transition: "opacity 120ms ease, color 120ms ease",
    width: "1.5rem",
    zIndex: "10",
  },
  ".mira-table-widget-shell:hover .mira-table-widget__source-toggle, .mira-table-widget-shell:focus-within .mira-table-widget__source-toggle":
    {
      opacity: "1",
    },
  ".mira-table-widget__source-toggle svg": {
    height: "0.95rem",
    width: "0.95rem",
  },
  ".mira-table-widget__source-toggle:hover": {
    background: "var(--mira-accent-soft)",
    color: "var(--mira-foreground)",
  },
  ".mira-rich-widget .mira-markdown-preview": {
    background: "transparent",
    height: "auto",
    margin: "0",
    overflow: "visible",
    padding: "0.1rem 0",
  },
  ".mira-rich-widget .markdown-rendered, .mira-rich-widget .markdown-rendered > *":
    {
      marginBlockEnd: "0",
      marginBlockStart: "0",
    },
  ".mira-rich-widget--table": {
    borderColor: "transparent",
    minHeight: "0 !important",
  },
  ".mira-rich-widget--table:hover": {
    borderColor: "transparent",
  },
  ".cm-header": {
    fontFamily: "var(--mira-font-sans)",
    fontWeight: "700",
    lineHeight: "var(--cm-block-line-height)",
  },
  ".cm-header-1": {
    "--cm-block-line-height": "var(--mira-h1-line-height, 1.2)",
    fontSize: "var(--mira-h1-size, 1.802em)",
  },
  ".cm-header-2": {
    "--cm-block-line-height": "var(--mira-h2-line-height, 1.2)",
    fontSize: "var(--mira-h2-size, 1.602em)",
  },
  ".cm-header-3": {
    "--cm-block-line-height": "var(--mira-h3-line-height, 1.3)",
    fontSize: "var(--mira-h3-size, 1.424em)",
  },
  ".cm-header-4": {
    "--cm-block-line-height": "var(--mira-h4-line-height, 1.4)",
    fontSize: "var(--mira-h4-size, 1.266em)",
  },
  ".cm-header-5": {
    "--cm-block-line-height": "var(--mira-h5-line-height, var(--mira-line-height))",
    fontSize: "var(--mira-h5-size, 1.125em)",
  },
  ".cm-header-6": {
    "--cm-block-line-height": "var(--mira-h6-line-height, var(--mira-line-height))",
    fontSize: "var(--mira-h6-size, 1em)",
  },
  ".cm-gutters .cm-gutterElement.cm-gutterHeader": {
    display: "inline-flex",
    alignItems: "center",
  },
  ".cm-gutters .cm-gutterElement.cm-gutterHeader-1": {
    "--cm-block-line-height": "var(--mira-h1-line-height, 1.2)",
  },
  ".cm-gutters .cm-gutterElement.cm-gutterHeader-2": {
    "--cm-block-line-height": "var(--mira-h2-line-height, 1.2)",
  },
  ".cm-gutters .cm-gutterElement.cm-gutterHeader-3": {
    "--cm-block-line-height": "var(--mira-h3-line-height, 1.3)",
  },
  ".cm-gutters .cm-gutterElement.cm-gutterHeader-4": {
    "--cm-block-line-height": "var(--mira-h4-line-height, 1.4)",
  },
  ".cm-gutters .cm-gutterElement.cm-gutterHeader-5": {
    "--cm-block-line-height": "var(--mira-h5-line-height, var(--mira-line-height))",
  },
  ".cm-gutters .cm-gutterElement.cm-gutterHeader-6": {
    "--cm-block-line-height": "var(--mira-h6-line-height, var(--mira-line-height))",
  },
  ".mira-task-checkbox": {
    appearance: "none",
    backgroundColor: "transparent",
    border: "1px solid var(--mira-checkbox-border, var(--mira-border-strong))",
    borderRadius: "var(--mira-checkbox-radius, 4px)",
    boxSizing: "border-box",
    cursor: "pointer",
    height: "var(--mira-checkbox-size, 1.15em)",
    margin: "0 0.5em 0 0",
    position: "relative",
    verticalAlign: "-0.18em",
    width: "var(--mira-checkbox-size, 1.15em)",
  },
  ".mira-task-checkbox:hover, .mira-task-checkbox:focus": {
    borderColor: "var(--mira-checkbox-border-hover, var(--mira-muted-foreground))",
    outline: "0",
  },
  ".mira-task-checkbox:focus-visible": {
    boxShadow: "0 0 0 2px var(--mira-selection)",
  },
  ".mira-task-checkbox:checked": {
    backgroundColor: "var(--mira-checkbox-color, var(--mira-accent))",
    borderColor: "var(--mira-checkbox-color, var(--mira-accent))",
  },
  ".mira-task-checkbox:checked::after": {
    backgroundColor: "var(--mira-checkbox-marker, var(--mira-accent-foreground))",
    content: "''",
    display: "block",
    height: "100%",
    inset: "-1px",
    maskImage:
      "url(\"data:image/svg+xml,%3Csvg width='12' height='10' viewBox='0 0 12 10' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4.2 9.2 0.7 5.7l1.4-1.4 2.1 2.1L9.9 0.8l1.4 1.4z'/%3E%3C/svg%3E\")",
    maskPosition: "50% 52%",
    maskRepeat: "no-repeat",
    maskSize: "65%",
    position: "absolute",
    width: "100%",
  },
});
