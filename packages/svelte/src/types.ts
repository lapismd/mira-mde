import type {
  MiraAssetResolver,
  MiraCommand,
  MiraExtension,
  MiraFileAdapter,
  MiraImageConfig,
  MiraLinkResolver,
  MiraMode,
  MiraTheme,
  MiraThemeConfig,
  MiraTemplateSelection,
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
  blockControls?: boolean;
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
  imageConfig?: MiraImageConfig;
  frontmatterOpen?: boolean;
  frontmatterConfig?: MiraFrontmatterConfig;
  headingIds?: boolean;
  headingIdPrefix?: string;
  htmlPolicy?: "trusted" | "safe";
  emoji?: boolean;
  outline?: boolean;
  onChange?: (value: string) => void;
  onFrontmatterChange?: (nextYaml: string, nextValue: string) => void;
};

export type MiraMdeHandle = {
  executeCommand: (commandId: string) => boolean;
  focus: () => void;
  getCommands: () => readonly MiraCommand[];
  getMarkdown: () => string;
  getMode: () => MiraMode;
  getSelection: () => MiraEditorSelection | null;
  insertImage: () => void;
  insertMarkdown: (markdown: string, selection?: MiraTemplateSelection) => void;
  isCommandEnabled: (commandId: string) => boolean;
  setMarkdown: (markdown: string) => void;
  setMode: (mode: MiraMode) => void;
  setReadonly: (readonly: boolean) => void;
  setSelection: (selection: MiraEditorSelection) => void;
};
