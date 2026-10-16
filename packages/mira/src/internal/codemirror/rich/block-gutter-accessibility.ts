import {
  ViewPlugin,
  type EditorView,
  type PluginValue,
} from "@codemirror/view";

type AttributeLease = { previous: string | null; owned: string | null };
const interactive =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

class AccessibleBlockGutters implements PluginValue {
  private leases = new Map<Element, AttributeLease>();
  private disposed = false;
  private scheduled = false;

  constructor(private view: EditorView) {
    this.schedule();
  }

  update(): void {
    this.schedule();
  }

  private schedule(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    // Attribute ownership needs current DOM, not layout or a later paint.
    queueMicrotask(() => {
      this.scheduled = false;
      if (this.disposed) return;
      const roots = [...this.view.dom.querySelectorAll(".cm-gutters")].filter(
        (root) => root.querySelector(".mira-block-controls-gutter"),
      );
      const next = new Map<Element, string | null>();
      for (const root of roots) {
        next.set(root, null);
        for (const column of root.querySelectorAll(".cm-gutter"))
          next.set(column, column.querySelector(interactive) ? null : "true");
      }
      for (const [element, lease] of this.leases) {
        if (!next.has(element)) {
          this.restore(element, lease);
          this.leases.delete(element);
        }
      }
      for (const [element, owned] of next) {
        if (!this.leases.has(element))
          this.leases.set(element, {
            previous: element.getAttribute("aria-hidden"),
            owned,
          });
        else this.leases.get(element)!.owned = owned;
        if (owned === null) element.removeAttribute("aria-hidden");
        else if (element.getAttribute("aria-hidden") !== owned)
          element.setAttribute("aria-hidden", owned);
      }
    });
  }

  private restore(element: Element, lease: AttributeLease): void {
    if (element.getAttribute("aria-hidden") !== lease.owned) return;
    if (lease.previous === null) element.removeAttribute("aria-hidden");
    else element.setAttribute("aria-hidden", lease.previous);
  }

  destroy(): void {
    this.disposed = true;
    for (const [element, lease] of this.leases) this.restore(element, lease);
    this.leases.clear();
  }
}

export const accessibleBlockGutters = ViewPlugin.fromClass(
  AccessibleBlockGutters,
);
