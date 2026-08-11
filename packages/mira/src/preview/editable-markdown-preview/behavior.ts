export const EDITABLE_MARKDOWN_PREVIEW_INTERACTIVE_SELECTOR = [
  "a",
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

function toElement(target: EventTarget | null): Element | null {
  if (target instanceof Element) {
    return target;
  }

  if (target instanceof Node) {
    return target.parentElement;
  }

  return null;
}

export function isEditableMarkdownPreviewInteractiveTarget(
  target: EventTarget | null,
): boolean {
  return Boolean(
    toElement(target)?.closest(EDITABLE_MARKDOWN_PREVIEW_INTERACTIVE_SELECTOR),
  );
}

export function shouldActivateEditableMarkdownPreview(
  event: MouseEvent,
  boundary?: Element,
): boolean {
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

  const interactive = toElement(event.target)?.closest(
    EDITABLE_MARKDOWN_PREVIEW_INTERACTIVE_SELECTOR,
  );
  return !interactive || interactive === boundary;
}

export function getEditableMarkdownPreviewOffset(
  event: MouseEvent,
): number | null {
  const value = toElement(event.target)?.closest<HTMLElement>("[data-offset]")
    ?.dataset.offset;
  if (value === undefined) {
    return null;
  }

  const offset = Number.parseInt(value, 10);
  return Number.isFinite(offset) ? offset : null;
}

export function shouldReturnEditableMarkdownPreviewOnBlur(
  container: HTMLElement,
  relatedTarget: EventTarget | null,
  activeElement: Element | null,
): boolean {
  const nextFocus =
    relatedTarget instanceof Node
      ? relatedTarget
      : activeElement instanceof Node
        ? activeElement
        : null;

  return !(nextFocus && container.contains(nextFocus));
}
