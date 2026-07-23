import {
  EditorSelection,
  EditorState,
  Transaction,
  type Extension,
} from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type {
  MiraAssetResolver,
  MiraExtension,
  MiraFileAdapter,
  MiraImageConfig,
  MiraLinkResolver,
  MiraMode,
  MiraTheme,
  MiraThemeConfig,
} from "@mira-mde/extensions";
export {
  createImageDropPasteExtension,
  createImageMarkdown,
  createUploadingImageMarkdown,
  defaultMiraImageMaxSizeBytes,
  defaultMiraImageMimeTypes,
  insertImageFiles,
  miraUploadingImageScheme,
  openImageFilePicker,
  resolveMiraImageConfig,
} from "./images";
export type { ResolvedMiraImageConfig } from "./images";

export type MiraEditorPosition = {
  line: number;
  ch: number;
};

export type MiraEditorSelection = {
  anchor: MiraEditorPosition;
  head: MiraEditorPosition;
};

export type MiraEditorOptions = {
  value?: string;
  extensions?: MiraExtension[];
  mode?: MiraMode;
  readonly?: boolean;
  placeholder?: string;
  lineWrapping?: boolean;
  spellcheck?: boolean;
  theme?: MiraTheme;
  themeConfig?: MiraThemeConfig;
  sourcePath?: string;
  linkResolver?: MiraLinkResolver;
  assetResolver?: MiraAssetResolver;
  fileAdapter?: MiraFileAdapter;
  imageConfig?: MiraImageConfig;
  frontmatterOpen?: boolean;
  frontmatterConfig?: unknown;
  onChange?: (value: string, change: MiraEditorChange) => void;
  onFrontmatterChange?: (nextYaml: string, nextValue: string) => void;
  onSelectionChange?: (selection: MiraEditorSelection) => void;
};

export type MiraEditorChange = {
  view: EditorView;
  docChanged: boolean;
  userEvent: string | undefined;
};

export type MiraEditorControllerOptions = MiraEditorOptions & {
  codeMirrorExtensions?: Extension[];
};

export type MiraEditorControllerUpdate = Partial<
  Omit<MiraEditorControllerOptions, "codeMirrorExtensions">
> & {
  codeMirrorExtensions?: Extension[];
};

export function toOffset(
  doc: EditorState["doc"],
  position: MiraEditorPosition,
): number {
  const lineNumber = Math.max(1, Math.min(doc.lines, position.line + 1));
  const line = doc.line(lineNumber);
  return Math.max(line.from, Math.min(line.to, line.from + position.ch));
}

export function fromOffset(
  doc: EditorState["doc"],
  offset: number,
): MiraEditorPosition {
  const line = doc.lineAt(Math.max(0, Math.min(doc.length, offset)));
  return {
    line: line.number - 1,
    ch: offset - line.from,
  };
}

export class MiraEditorController {
  readonly view: EditorView;

  private value: string;

  private options: MiraEditorControllerOptions;

  private suppressChange = false;

  constructor(options: MiraEditorControllerOptions = {}) {
    this.value = options.value ?? "";
    this.options = options;

    this.view = new EditorView({
      state: this.createState(this.value, options.codeMirrorExtensions ?? []),
      dispatch: (transaction) => {
        this.view.update([transaction]);

        if (transaction.docChanged) {
          const nextValue = this.view.state.doc.toString();
          this.value = nextValue;
          if (!this.suppressChange) {
            this.options.onChange?.(nextValue, {
              view: this.view,
              docChanged: true,
              userEvent: transaction.annotation(Transaction.userEvent),
            });
          }
        }

        if (transaction.selection) {
          this.options.onSelectionChange?.(this.getSelection());
        }
      },
    });
  }

  mount(target: HTMLElement): void {
    if (this.view.dom.parentElement !== target) {
      target.append(this.view.dom);
    }
  }

  destroy(): void {
    this.view.destroy();
  }

  focus(): void {
    this.view.focus();
  }

  getValue(): string {
    return this.view.state.doc.toString();
  }

  setValue(value: string): void {
    if (value === this.getValue()) {
      return;
    }

    this.suppressChange = true;
    this.value = value;
    this.view.dispatch({
      changes: {
        from: 0,
        to: this.view.state.doc.length,
        insert: value,
      },
    });
    this.suppressChange = false;
  }

  update(options: MiraEditorControllerUpdate): void {
    this.options = {
      ...this.options,
      ...options,
    };

    if (options.value !== undefined) {
      this.setValue(options.value);
    }

    if (options.codeMirrorExtensions) {
      const selection = this.view.state.selection;
      this.view.setState(
        this.createState(
          this.getValue(),
          options.codeMirrorExtensions,
          selection,
        ),
      );
    }
  }

  getSelection(): MiraEditorSelection {
    const selection = this.view.state.selection.main;
    return {
      anchor: fromOffset(this.view.state.doc, selection.anchor),
      head: fromOffset(this.view.state.doc, selection.head),
    };
  }

  setSelection(selection: MiraEditorSelection): void {
    this.view.dispatch({
      selection: EditorSelection.single(
        toOffset(this.view.state.doc, selection.anchor),
        toOffset(this.view.state.doc, selection.head),
      ),
      scrollIntoView: true,
    });
  }

  replaceSelection(value: string): void {
    this.view.dispatch(this.view.state.replaceSelection(value));
  }

  private createState(
    value: string,
    extensions: Extension[],
    selection?: EditorSelection,
  ): EditorState {
    return EditorState.create({
      doc: value,
      selection,
      extensions,
    });
  }
}

export function createMiraEditorController(
  options: MiraEditorControllerOptions = {},
): MiraEditorController {
  return new MiraEditorController(options);
}
