import { foldEffect, foldedRanges, foldable, unfoldEffect } from "@codemirror/language";
import { RangeSetBuilder, type Extension } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView, type PluginValue, ViewPlugin, type ViewUpdate, WidgetType } from "@codemirror/view";
import type { RangeBoundary } from "../utils/ranges";

export function foldIndicatorDecorations(): Extension {
  return ViewPlugin.fromClass(FoldIndicatorPlugin, {
    decorations: (value) => value.decorations,
  });
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
