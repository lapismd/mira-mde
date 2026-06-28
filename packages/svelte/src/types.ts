import type {
  MiraAssetResolver,
  MiraExtension,
  MiraLinkResolver,
  MiraMode,
  MiraTheme,
} from "@mira-mde/extensions";
import type { MiraEditorSelection } from "@mira-mde/core";

export type MiraMdeProps = {
  value: string;
  mode?: MiraMode;
  extensions?: MiraExtension[];
  readonly?: boolean;
  placeholder?: string;
  lineWrapping?: boolean;
  spellcheck?: boolean;
  theme?: MiraTheme;
  sourcePath?: string;
  class?: string;
  toolbar?: boolean;
  linkResolver?: MiraLinkResolver;
  assetResolver?: MiraAssetResolver;
  frontmatterOpen?: boolean;
  onChange?: (value: string) => void;
  onFrontmatterChange?: (nextYaml: string, nextValue: string) => void;
};

export type MiraMdeHandle = {
  focus: () => void;
  getMarkdown: () => string;
  getMode: () => MiraMode;
  getSelection: () => MiraEditorSelection | null;
  insertMarkdown: (markdown: string) => void;
  setMarkdown: (markdown: string) => void;
  setMode: (mode: MiraMode) => void;
  setReadonly: (readonly: boolean) => void;
  setSelection: (selection: MiraEditorSelection) => void;
};
