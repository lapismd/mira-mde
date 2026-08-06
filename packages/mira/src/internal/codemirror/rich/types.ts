import type {
  MiraAssetResolver,
  MiraExtension,
  MiraFileAdapter,
  MiraListCallout,
  MiraLinkResolver,
  MiraBlockAction,
  MiraBlockControlsOptions,
} from "@lapismd/mira/extensions";
import type { EditorView } from "@codemirror/view";

export type MiraRichEditorOptions = {
  enabled?: boolean;
  livePreview?: boolean;
  readonly?: boolean;
  blockControls?: boolean | MiraBlockControlsOptions;
  blockActions?: MiraBlockAction[];
  indentGuides?: boolean;
  extensions?: MiraExtension[];
  sourcePath?: string;
  linkResolver?: MiraLinkResolver;
  assetResolver?: MiraAssetResolver;
  fileAdapter?: MiraFileAdapter;
  frontmatterOpen?: boolean;
  frontmatterConfig?: unknown;
  listCallouts?: MiraListCallout[];
  onChange?: (
    replacement: string,
    from: number,
    to: number,
    nextValue: string,
  ) => void;
  onFrontmatterChange?: (nextYaml: string, nextValue: string) => void;
  insertImage?: (view: EditorView) => void;
};
