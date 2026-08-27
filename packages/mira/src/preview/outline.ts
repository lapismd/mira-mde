export type MarkdownOutlineVariant = "floating" | "sidebar";

export type MarkdownOutlineItem = {
  id: string;
  text: string;
  level: number;
};

function hasScrollableOverflow(element: HTMLElement): boolean {
  const style = getComputedStyle(element);
  return /(?:auto|scroll|overlay)/u.test(
    `${style.overflowY} ${style.overflow}`,
  );
}

/**
 * Resolve the element that actually owns preview scrolling. Consumers may
 * deliberately make Mira's preview overflow visible and provide an outer
 * scroll area, so the preview element is only preferred while it has a real
 * scroll range.
 */
export function findMarkdownOutlineScrollRoot(
  target: HTMLElement | null,
  root: HTMLElement | null,
): HTMLElement | null {
  const overflowCandidates: HTMLElement[] = [];
  let current = target?.parentElement ?? root;

  while (current) {
    if (hasScrollableOverflow(current)) {
      if (current.scrollHeight > current.clientHeight) return current;
      overflowCandidates.push(current);
    }
    current = current.parentElement;
  }

  return overflowCandidates[0] ?? null;
}

export function activeMarkdownOutlineId(
  items: MarkdownOutlineItem[],
  headingElement: (item: MarkdownOutlineItem) => HTMLElement | null,
  scrollRoot: HTMLElement | null,
  activationOffset = 96,
  activeElement: Element | null = null,
): string {
  if (items.length === 0) return "";

  if (activeElement instanceof HTMLElement) {
    const focused = items.find(
      (item) => headingElement(item) === activeElement,
    );
    if (focused) return focused.id;
  }

  const rootTop = scrollRoot?.getBoundingClientRect().top ?? 0;
  let current = items[0]!;

  for (const item of items) {
    const target = headingElement(item);
    if (!target) continue;
    if (target.getBoundingClientRect().top - rootTop <= activationOffset) {
      current = item;
    } else {
      break;
    }
  }

  return current.id;
}

export function slugHeadingText(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "heading"
  );
}
