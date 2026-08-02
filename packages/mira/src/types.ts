import type {
  MiraAssetResolver,
  MiraCommand,
  MiraExtension,
  MiraFileAdapter,
  MiraImageConfig,
  MiraLinkResolver,
  MiraMarkdownAuthoringConfig,
  MiraMode,
  MiraTheme,
  MiraThemeConfig,
  MiraTemplateSelection,
} from "@lapismd/mira/extensions";
import type { MiraEditorSelection } from "@lapismd/mira/core";
import type {
  FrontmatterConfig,
  MarkdownOutlineVariant,
} from "@lapismd/mira/preview";

export type MiraFrontmatterConfig = FrontmatterConfig;
export type MiraOutlineVariant = MarkdownOutlineVariant;

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
  authoring?: MiraMarkdownAuthoringConfig;
  frontmatterOpen?: boolean;
  frontmatterConfig?: MiraFrontmatterConfig;
  headingIds?: boolean;
  headingIdPrefix?: string;
  htmlPolicy?: "trusted" | "safe";
  emoji?: boolean;
  outline?: boolean;
  outlineVariant?: MiraOutlineVariant;
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
