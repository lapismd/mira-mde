import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

export type MiraRichEditorOptions = {
  enabled?: boolean;
};

export function createRichEditorExtensions(
  options: MiraRichEditorOptions = {},
): Extension[] {
  if (options.enabled === false) {
    return [];
  }

  return [
    EditorView.editorAttributes.of({
      class: "mira-mde-live-preview-mode markdown-live-preview-mode",
    }),
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
