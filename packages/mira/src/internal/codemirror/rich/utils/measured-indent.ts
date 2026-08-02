import {
  StateEffect,
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
} from "@codemirror/view";

const measuredPaddingProperty = "--hmd-indent-padding-measured";
const measuredPrefixProperty = "--hmd-indent-prefix-measured";

type IndentMeasurement = {
  paddingPx: number;
  prefixPx: number;
};

const setMeasuredIndent =
  StateEffect.define<ReadonlyMap<number, IndentMeasurement>>();

function measuredIndentDecorations(
  measurements: ReadonlyMap<number, IndentMeasurement>,
): DecorationSet {
  const ranges: Range<Decoration>[] = [];
  for (const [from, measurement] of measurements) {
    ranges.push(
      Decoration.line({
        attributes: {
          style: [
            `${measuredPaddingProperty}: ${measurement.paddingPx}px;`,
            `${measuredPrefixProperty}: ${measurement.prefixPx}px;`,
          ].join(" "),
        },
      }).range(from),
    );
  }
  return Decoration.set(ranges.sort((left, right) => left.from - right.from));
}

const measuredIndentField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(value, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(setMeasuredIndent)) {
        return measuredIndentDecorations(effect.value);
      }
    }
    return transaction.docChanged ? value.map(transaction.changes) : value;
  },
  provide: (field) => EditorView.decorations.from(field),
});

function measurementsEqual(
  left: ReadonlyMap<number, IndentMeasurement>,
  right: ReadonlyMap<number, IndentMeasurement>,
): boolean {
  if (left.size !== right.size) {
    return false;
  }
  for (const [from, measurement] of left) {
    const other = right.get(from);
    if (
      !other ||
      Math.abs(other.paddingPx - measurement.paddingPx) > 0.25 ||
      Math.abs(other.prefixPx - measurement.prefixPx) > 0.25
    ) {
      return false;
    }
  }
  return true;
}

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
  return line.match(/^\s*(?:>\s*)+/u)?.[0].length ?? 0;
}

function measureWidget(line: HTMLElement): number | null {
  const widget = line.querySelector<HTMLElement>(
    ".cm-plain-indent-widget, .cm-hmd-list-indent",
  );
  const width = widget?.getBoundingClientRect().width;
  return width && Number.isFinite(width) && width > 0 ? width : null;
}

function measureMarker(line: HTMLElement): number {
  const marker = line.querySelector<HTMLElement>(
    ".cm-formatting-list-ul, .cm-formatting-list-ol",
  );
  const width = marker?.getBoundingClientRect().width;
  return width && Number.isFinite(width) && width > 0 ? width : 0;
}

function measureFirstContentOffset(line: HTMLElement): number | null {
  const lineRect = line.getBoundingClientRect();
  const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!(node instanceof Text)) {
      continue;
    }
    if (
      node.parentElement?.closest(
        ".cm-hmd-list-indent, .cm-plain-indent-widget, .cm-formatting-list-ul, .cm-formatting-list-ol, .cm-blockquote-border, .cm-formatting-quote",
      )
    ) {
      continue;
    }

    const index = Array.from(node.textContent ?? "").findIndex((character) =>
      /\S/u.test(character),
    );
    if (index < 0) {
      continue;
    }
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
  private lastMeasurements = new Map<number, IndentMeasurement>();
  private scheduled = false;
  private retryFrames = 0;
  private destroyed = false;

  constructor(view: EditorView) {
    this.schedule(view);
    this.retryStartup(view);
  }

  update(update: ViewUpdate): void {
    if (update.geometryChanged) {
      this.cache.clear();
    }
    if (
      update.geometryChanged ||
      update.docChanged ||
      update.viewportChanged ||
      update.focusChanged ||
      !update.startState.selection.eq(update.state.selection)
    ) {
      this.schedule(update.view);
    }
  }

  private schedule(view: EditorView): boolean {
    if (this.scheduled) {
      return true;
    }
    this.scheduled = true;
    requestAnimationFrame(() => {
      this.scheduled = false;
      if (!this.destroyed) {
        this.measure(view);
      }
    });
    return true;
  }

  private measure(view: EditorView): void {
    const measurements = new Map<number, IndentMeasurement>();
    const lines = view.contentDOM.querySelectorAll<HTMLElement>(
      ".cm-line[data-indent-prefix]",
    );
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
      const lineText = view.state.doc.lineAt(from).text;
      const quoteLength = quotePrefixLength(lineText);
      const fallbackColumns = Number.parseFloat(
        line.dataset["indentFallbackColumns"] ?? "",
      );
      const fallbackPx = Number.isFinite(fallbackColumns)
        ? fallbackColumns * view.defaultCharacterWidth
        : null;
      const indentWidth =
        this.cache.get(cacheKey) ??
        measureWidget(line) ??
        (prefix.length > 0
          ? prefix.length * view.defaultCharacterWidth
          : null) ??
        (prefix.length === 0 ? 0 : null);
      const markerWidth = isList ? measureMarker(line) : 0;
      const quoteWidth =
        variant === "quote" || variant === "quote-list"
          ? quoteLength * view.defaultCharacterWidth
          : null;
      let prefixPx = indentWidth;
      let paddingPx = indentWidth;
      if (isList && prefixPx !== null) {
        prefixPx += markerWidth;
        paddingPx = prefixPx;
      }
      if (quoteWidth !== null) {
        prefixPx =
          variant === "quote-list" ? quoteWidth + markerWidth : quoteWidth;
        paddingPx = prefixPx;
      }
      prefixPx ??= fallbackPx;
      paddingPx ??= fallbackPx;
      if (prefixPx === 0 && fallbackPx && fallbackPx > 0) {
        prefixPx = fallbackPx;
      }
      if (paddingPx === 0 && fallbackPx && fallbackPx > 0) {
        paddingPx = fallbackPx;
      }

      const anchorFrom = Number.parseInt(
        line.dataset["indentAnchorLineFrom"] ?? "",
        10,
      );
      if (Number.isFinite(anchorFrom)) {
        const anchor = view.contentDOM.querySelector<HTMLElement>(
          `.cm-line[data-line-from="${anchorFrom}"]`,
        );
        const anchorOffset = anchor ? measureFirstContentOffset(anchor) : null;
        if (anchorOffset !== null && anchorOffset > 0) {
          paddingPx = anchorOffset;
        }
      }
      if (prefixPx === null || paddingPx === null) {
        continue;
      }

      measurements.set(from, { paddingPx, prefixPx });
      if (
        indentWidth !== null &&
        (!this.cache.has(cacheKey) ||
          Math.abs((this.cache.get(cacheKey) ?? 0) - indentWidth) > 0.5)
      ) {
        this.cache.set(cacheKey, indentWidth);
      }
    }
    if (!measurementsEqual(this.lastMeasurements, measurements)) {
      this.lastMeasurements = measurements;
      view.dispatch({ effects: setMeasuredIndent.of(measurements) });
    }
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
    measuredIndentField,
    ViewPlugin.fromClass(MeasuredIndentPlugin),
    EditorView.editorAttributes.of({ class: "cm-measured-indent" }),
  ];
}
