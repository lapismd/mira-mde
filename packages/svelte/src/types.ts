import type {
  MiraAssetResolver,
  MiraExtension,
  MiraFileAdapter,
  MiraLinkResolver,
  MiraMode,
  MiraTheme,
  MiraThemeConfig,
} from "@mira-mde/extensions";
import type { MiraEditorSelection } from "@mira-mde/core";

export type MiraFrontmatterConfig = {
  types?: Record<string, unknown>;
  properties?: Record<string, unknown>;
  widgets?: unknown[];
};

export type MiraMdeProps = {
  value: string;
  mode?: MiraMode;
  extensions?: MiraExtension[];
  readonly?: boolean;
  placeholder?: string;
  lineWrapping?: boolean;
  spellcheck?: boolean;
  indentGuides?: boolean;
  indentWithTabs?: boolean;
  indentWidth?: number;
  theme?: MiraTheme;
  themeConfig?: MiraThemeConfig;
  sourcePath?: string;
  class?: string;
  toolbar?: boolean;
  linkResolver?: MiraLinkResolver;
  assetResolver?: MiraAssetResolver;
  fileAdapter?: MiraFileAdapter;
  frontmatterOpen?: boolean;
  frontmatterConfig?: MiraFrontmatterConfig;
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
