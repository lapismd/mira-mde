import type { Extension } from "@codemirror/state";
import {
  EditorView,
  type PluginValue,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";

export function consecutiveTableLineGroups(
  content: HTMLElement,
): HTMLElement[][] {
  const groups: HTMLElement[][] = [];
  let current: HTMLElement[] = [];

  for (const child of Array.from(content.children)) {
    if (!(child instanceof HTMLElement)) {
      continue;
    }
    if (
      child.classList.contains("cm-line") &&
      child.classList.contains("cm-table")
    ) {
      current.push(child);
      continue;
    }
    if (current.length > 0) {
      groups.push(current);
      current = [];
    }
  }

  if (current.length > 0) {
    groups.push(current);
  }

  return groups;
}

type TableLineGroupMeasurement = {
  lines: HTMLElement[];
  naturalWidths: number[];
};

function measureTableLineGroups(
  content: HTMLElement,
): TableLineGroupMeasurement[] {
  return consecutiveTableLineGroups(content).map((lines) => ({
    lines,
    naturalWidths: lines.map((line) => {
      const ownedPadding = Number.parseFloat(line.style.paddingInlineEnd) || 0;
      return Math.max(0, line.scrollWidth - ownedPadding);
    }),
  }));
}

function bindMeasuredTableLineScrollSync(
  measurements: TableLineGroupMeasurement[],
): () => void {
  const listeners = new Map<HTMLElement, EventListener>();
  const previousPresentation = new Map<
    HTMLElement,
    {
      paddingInlineEnd: string;
      scrollSync: string | null;
      tabIndex: string | null;
    }
  >();
  let syncing = false;

  for (const { lines: group, naturalWidths } of measurements) {
    const sharedScrollWidth = Math.max(...naturalWidths);

    for (const [index, line] of group.entries()) {
      previousPresentation.set(line, {
        paddingInlineEnd: line.style.paddingInlineEnd,
        scrollSync: line.getAttribute("data-mira-table-scroll-sync"),
        tabIndex: line.getAttribute("tabindex"),
      });
      line.style.paddingInlineEnd = `${Math.max(
        0,
        sharedScrollWidth - naturalWidths[index]!,
      )}px`;
      line.setAttribute("data-mira-table-scroll-sync", "true");
      line.tabIndex = 0;

      const listener = (): void => {
        if (syncing) {
          return;
        }
        syncing = true;
        try {
          const left = line.scrollLeft;
          for (const sibling of group) {
            if (sibling.scrollLeft !== left) {
              sibling.scrollLeft = left;
            }
          }
        } finally {
          syncing = false;
        }
      };
      line.addEventListener("scroll", listener, { passive: true });
      listeners.set(line, listener);
    }
  }

  return () => {
    for (const [line, listener] of listeners) {
      line.removeEventListener("scroll", listener);
    }
    listeners.clear();
    for (const [line, previous] of previousPresentation) {
      line.style.paddingInlineEnd = previous.paddingInlineEnd;
      if (previous.scrollSync === null) {
        line.removeAttribute("data-mira-table-scroll-sync");
      } else {
        line.setAttribute("data-mira-table-scroll-sync", previous.scrollSync);
      }
      if (previous.tabIndex === null) {
        line.removeAttribute("tabindex");
      } else {
        line.setAttribute("tabindex", previous.tabIndex);
      }
    }
    previousPresentation.clear();
  };
}

export function bindTableLineScrollSync(content: HTMLElement): () => void {
  return bindMeasuredTableLineScrollSync(measureTableLineGroups(content));
}

class TableLineScrollSync implements PluginValue {
  private unbind: () => void = () => {};

  constructor(private readonly view: EditorView) {
    this.scheduleBind();
  }

  update(update: ViewUpdate): void {
    if (update.docChanged || update.viewportChanged) {
      this.scheduleBind();
    }
  }

  destroy(): void {
    this.unbind();
  }

  private scheduleBind(): void {
    this.view.requestMeasure({
      key: this,
      read: () => measureTableLineGroups(this.view.contentDOM),
      write: (measurements) => {
        this.unbind();
        this.unbind = bindMeasuredTableLineScrollSync(measurements);
      },
    });
  }
}

export function tableLineScrollSync(): Extension {
  return ViewPlugin.fromClass(TableLineScrollSync);
}
