import type { Extension } from "@codemirror/state";
import type { EditorView, ViewUpdate } from "@codemirror/view";
import type { MiraEditorSelection } from "@lapismd/mira/core";
import type { MiraTemplateSelection } from "@lapismd/mira/extensions";

export type MiraCodeEditorVariant = "code" | "document";
export type MiraCodeEditorSurface = "framed" | "frameless";
export type MiraCodeEditorHeight = "content" | "fill";

export type MiraCodeEditorProps = {
  value?: string;
  extensions?: Extension | readonly Extension[];
  readonly?: boolean;
  placeholder?: string;
  lineWrapping?: boolean;
  spellcheck?: boolean;
  lineNumbers?: boolean;
  indentWithTabs?: boolean;
  indentWidth?: number;
  ariaLabel?: string;
  invalid?: boolean;
  minHeight?: string;
  scrollerTabIndex?: number | null;
  variant?: MiraCodeEditorVariant;
  surface?: MiraCodeEditorSurface;
  height?: MiraCodeEditorHeight;
  class?: string;
  onChange?: (value: string) => void;
  onUpdate?: (update: ViewUpdate) => void;
  onFocus?: (event: FocusEvent, view: EditorView) => void;
  onBlur?: (event: FocusEvent, view: EditorView) => void;
};

export type MiraCodeEditorHandle = {
  focus: () => void;
  getValue: () => string;
  setValue: (value: string) => void;
  getSelection: () => MiraEditorSelection | null;
  setSelection: (selection: MiraEditorSelection) => void;
  replaceSelection: (value: string, selection?: MiraTemplateSelection) => void;
  getView: () => EditorView | null;
};
