/**
 * Hangs indented CodeMirror lines at the rendered width of their authored
 * prefix. Structural decorations provide deterministic fallbacks; this plugin
 * refines them with measured pixels after layout.
 *
 * Stable widget widths and currently visible raw-prefix widths are measured
 * separately so revealing a prefix for editing cannot move its content column.
 */
import type { Extension } from "@codemirror/state";
import {
  EditorView,
  type PluginValue,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";

type IndentMeasurement = {
  paddingPx: number;
  prefixPx: number;
};

type RawPrefixBox = {
  width: number;
};

const measuredPaddingProperty = "--hmd-indent-padding-measured";
const measuredPrefixProperty = "--hmd-indent-prefix-measured";

function setStylePropertyIfChanged(
  line: HTMLElement,
  property: string,
  value: string,
): void {
  if (line.style.getPropertyValue(property) !== value) {
    line.style.setProperty(property, value);
  }
}

function removeStylePropertyIfPresent(
  line: HTMLElement,
  property: string,
): void {
  if (line.style.getPropertyValue(property)) {
    line.style.removeProperty(property);
  }
}

export function syncMeasuredIndentStyles(
  content: HTMLElement,
  measurements: ReadonlyMap<number, IndentMeasurement>,
): void {
  for (const line of content.querySelectorAll<HTMLElement>(".cm-line")) {
    const from = Number.parseInt(line.dataset["lineFrom"] ?? "", 10);
    const measurement = Number.isFinite(from)
      ? measurements.get(from)
      : undefined;
    if (!measurement) {
      removeStylePropertyIfPresent(line, measuredPaddingProperty);
      removeStylePropertyIfPresent(line, measuredPrefixProperty);
      continue;
    }

    setStylePropertyIfChanged(
      line,
      measuredPaddingProperty,
      `${measurement.paddingPx}px`,
    );
    setStylePropertyIfChanged(
      line,
      measuredPrefixProperty,
      `${measurement.prefixPx}px`,
    );
  }
}

function quotePrefixLength(line: string): number {
  return line.match(/^\s*>+\s*/u)?.[0].length ?? 0;
}

function measureLeadingRawPrefixBox(
  line: HTMLElement,
  prefix: string,
): RawPrefixBox | null {
  const rawPrefix = Array.from(line.childNodes).find(
    (node): node is Text =>
      node.nodeType === Node.TEXT_NODE &&
      typeof node.textContent === "string" &&
      node.textContent.startsWith(prefix),
  );
  if (!rawPrefix) {
    return null;
  }

  const range = document.createRange();
  range.setStart(rawPrefix, 0);
  range.setEnd(rawPrefix, Math.min(prefix.length, rawPrefix.length));
  const rect =
    Array.from(range.getClientRects()).find(
      (candidate) => candidate.width > 0 || candidate.height > 0,
    ) ?? range.getBoundingClientRect();
  return Number.isFinite(rect.width) && rect.width > 0
    ? { width: rect.width }
    : null;
}

function measureMarkerWidth(line: HTMLElement): number {
  const marker = line.querySelector<HTMLElement>(
    ".cm-formatting-list-ul, .cm-formatting-list-ol",
  );
  const width = marker?.getBoundingClientRect().width;
  return width && Number.isFinite(width) && width > 0 ? width : 0;
}

function measureQuotePrefixWidth(
  view: EditorView,
  from: number,
): number | null {
  const length = quotePrefixLength(view.state.doc.lineAt(from).text);
  if (length <= 0) {
    return null;
  }

  const start = view.coordsAtPos(from);
  const end = view.coordsAtPos(from + length);
  if (!start || !end) {
    return null;
  }
  const measured = end.left - start.left;
  return Number.isFinite(measured) && measured > 0 ? measured : null;
}

function measureOwnPrefixWidth(
  view: EditorView,
  line: HTMLElement,
  from: number,
  prefix: string,
): number | null {
  const widget = line.querySelector<HTMLElement>(
    ".cm-plain-indent-widget, .cm-hmd-list-indent",
  );
  if (widget) {
    const segmentWidth = Array.from(
      widget.querySelectorAll<HTMLElement>(".cm-indent"),
    ).reduce((total, segment) => {
      const width = segment.getBoundingClientRect().width;
      return total + (Number.isFinite(width) && width > 0 ? width : 0);
    }, 0);
    if (segmentWidth > 0) {
      return segmentWidth;
    }

    const widgetWidth = widget.getBoundingClientRect().width;
    if (Number.isFinite(widgetWidth) && widgetWidth > 0) {
      return widgetWidth;
    }
  }

  const rawWidth = measureLeadingRawPrefixBox(line, prefix)?.width;
  if (rawWidth !== undefined) {
    return rawWidth;
  }

  const start = view.coordsAtPos(from);
  const end = view.coordsAtPos(from + prefix.length);
  if (start && end) {
    const measured = end.left - start.left;
    if (Number.isFinite(measured) && measured > 0) {
      return measured;
    }
  }

  return null;
}

function measuredWidth(
  cache: Map<string, number>,
  seen: Set<string>,
  view: EditorView,
  line: HTMLElement,
  from: number,
  prefix: string,
  cacheKey: string,
): number | null {
  let width = cache.get(cacheKey) ?? null;
  if (width === null && !seen.has(cacheKey)) {
    seen.add(cacheKey);
    width = measureOwnPrefixWidth(view, line, from, prefix);
  }
  return width;
}

function firstContentTextNode(line: HTMLElement): Text | null {
  const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!(node instanceof Text)) {
      continue;
    }
    const skipped = node.parentElement?.closest(
      ".cm-hmd-list-indent, .cm-plain-indent-widget, .cm-formatting-list-ul, .cm-formatting-list-ol, .cm-blockquote-border, .cm-formatting-quote",
    );
    if (skipped && skipped !== line) {
      continue;
    }

    const index = Array.from(node.textContent ?? "").findIndex((character) =>
      /\S/u.test(character),
    );
    if (index < 0) {
      continue;
    }
    return node;
  }
  return null;
}

function measureLeadingContentChrome(line: HTMLElement): number {
  const node = firstContentTextNode(line);
  let chrome = 0;
  for (
    let element = node?.parentElement ?? null;
    element && element !== line;
    element = element.parentElement
  ) {
    const style = getComputedStyle(element);
    for (const value of [
      style.paddingInlineStart,
      style.borderInlineStartWidth,
      style.marginInlineStart,
    ]) {
      const width = Number.parseFloat(value);
      if (Number.isFinite(width)) {
        chrome += width;
      }
    }
  }
  return chrome;
}

function measureFirstContentOffset(line: HTMLElement): number | null {
  const lineRect = line.getBoundingClientRect();
  const node = firstContentTextNode(line);
  if (node) {
    const index = Array.from(node.textContent ?? "").findIndex((character) =>
      /\S/u.test(character),
    );
    const range = document.createRange();
    range.setStart(node, index);
    range.setEnd(node, Math.min(index + 1, node.length));
    const rect =
      Array.from(range.getClientRects()).find(
        (candidate) => candidate.width > 0 || candidate.height > 0,
      ) ?? range.getBoundingClientRect();
    if (Number.isFinite(rect.left) && (rect.width > 0 || rect.height > 0)) {
      return rect.left - lineRect.left;
    }
  }
  return null;
}

class MeasuredIndentPlugin implements PluginValue {
  private readonly cache = new Map<string, number>();
  private scheduled = false;
  private retryFrames = 0;
  private destroyed = false;

  constructor(view: EditorView) {
    this.schedule(view);
    this.retryStartup(view);
  }

  update(update: ViewUpdate): void {
    let needsMeasure = false;
    if (update.geometryChanged) {
      this.cache.clear();
      needsMeasure = true;
    }
    needsMeasure ||= update.docChanged || update.viewportChanged;
    needsMeasure ||= update.focusChanged;
    needsMeasure ||= !update.startState.selection.eq(update.state.selection);
    if (needsMeasure) {
      this.schedule(update.view);
    }
  }

  private schedule(view: EditorView): boolean {
    if (this.scheduled) {
      return true;
    }
    if (!view.inView) {
      return false;
    }
    this.scheduled = true;

    view.requestMeasure({
      read: () => {
        if (!view.inView) {
          return { measurements: [] };
        }

        const lines = view.contentDOM.querySelectorAll<HTMLElement>(
          ".cm-line[data-indent-prefix]",
        );
        const seen = new Set<string>();
        const measurements: Array<{
          cacheKey: string;
          from: number;
          paddingPx: number | null;
          prefixPx: number | null;
          stableIndentPx: number | null;
        }> = [];

        for (const line of lines) {
          const from = Number.parseInt(line.dataset["lineFrom"] ?? "", 10);
          if (!Number.isFinite(from)) {
            continue;
          }
          const prefix = line.dataset["indentPrefix"] ?? "";
          const variant = line.dataset["indentVariant"] ?? "unknown";
          const listKind = line.dataset["listKind"] ?? "";
          const cacheKey = `${variant}\u0000${listKind}\u0000${prefix}`;
          const isList = line.hasAttribute("data-list-kind");
          const hasPrefix = prefix.length > 0;
          const stableIndentPx = hasPrefix
            ? measuredWidth(
                this.cache,
                seen,
                view,
                line,
                from,
                prefix,
                cacheKey,
              )
            : isList
              ? 0
              : null;
          const rawPrefixWidth = hasPrefix
            ? measureLeadingRawPrefixBox(line, prefix)?.width
            : undefined;
          const hasIndentWidget = Boolean(
            line.querySelector(".cm-plain-indent-widget, .cm-hmd-list-indent"),
          );
          const visibleIndentPx = hasPrefix
            ? (rawPrefixWidth ??
              (hasIndentWidget && stableIndentPx !== null
                ? stableIndentPx + measureLeadingContentChrome(line)
                : measureOwnPrefixWidth(view, line, from, prefix)))
            : isList
              ? 0
              : null;
          const markerWidth = measureMarkerWidth(line);
          const lineText = view.state.doc.lineAt(from).text;
          const hasQuote = quotePrefixLength(lineText) > 0;
          const isQuoteList = variant === "quote-list" || (isList && hasQuote);
          const quoteWidth =
            variant === "quote" || isQuoteList
              ? measureQuotePrefixWidth(view, from)
              : null;

          let prefixPx = visibleIndentPx;
          if (isList && prefixPx !== null) {
            prefixPx += markerWidth;
          }
          if (quoteWidth !== null) {
            prefixPx = isQuoteList ? quoteWidth + markerWidth : quoteWidth;
          }

          let paddingPx = stableIndentPx;
          if (isList && paddingPx !== null) {
            paddingPx += markerWidth;
          }
          if (quoteWidth !== null) {
            paddingPx = isQuoteList ? quoteWidth + markerWidth : quoteWidth;
          }

          const anchorFrom = Number.parseInt(
            line.dataset["indentAnchorLineFrom"] ?? "",
            10,
          );
          if (Number.isFinite(anchorFrom)) {
            const anchor = view.contentDOM.querySelector<HTMLElement>(
              `.cm-line[data-line-from="${anchorFrom}"]`,
            );
            const anchorOffset = anchor
              ? measureFirstContentOffset(anchor)
              : null;
            if (anchorOffset !== null && anchorOffset > 0) {
              paddingPx = anchorOffset;
            }
          }

          measurements.push({
            cacheKey,
            from,
            paddingPx,
            prefixPx,
            stableIndentPx,
          });
        }

        return { measurements };
      },
      write: ({ measurements }) => {
        this.scheduled = false;
        const byFrom = new Map<number, IndentMeasurement>();
        for (const measurement of measurements) {
          const { cacheKey, from, paddingPx, prefixPx, stableIndentPx } =
            measurement;
          if (paddingPx === null || prefixPx === null) {
            continue;
          }
          byFrom.set(from, { paddingPx, prefixPx });
          const previous = this.cache.get(cacheKey);
          if (
            stableIndentPx !== null &&
            (previous === undefined ||
              Math.abs(previous - stableIndentPx) > 0.5)
          ) {
            this.cache.set(cacheKey, stableIndentPx);
          }
        }
        syncMeasuredIndentStyles(view.contentDOM, byFrom);
      },
    });
    return true;
  }

  private retryStartup(view: EditorView): void {
    if (this.destroyed || this.retryFrames > 60) {
      return;
    }
    this.retryFrames += 1;
    requestAnimationFrame(() => {
      if (!this.destroyed) {
        this.schedule(view);
        this.retryStartup(view);
      }
    });
  }

  destroy(): void {
    this.destroyed = true;
  }
}

export function measuredIndentExtension(): Extension {
  return [
    ViewPlugin.fromClass(MeasuredIndentPlugin),
    EditorView.editorAttributes.of({ class: "cm-measured-indent" }),
  ];
}
