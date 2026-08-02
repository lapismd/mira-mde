import type { MiraEditorSelection } from "@lapismd/mira/core";
import type {
  MiraAssetResolver,
  MiraCommand,
  MiraExtension,
  MiraFileAdapter,
  MiraImageConfig,
  MiraLinkResolver,
  MiraMarkdownAuthoringConfig,
  MiraMode,
  MiraColorMode,
  MiraTheme,
  MiraTemplateSelection,
} from "@lapismd/mira/extensions";
import type {
  MiraEditorFeatureConfigs,
  MiraEditorToolbarAction,
  MiraEditorToolbarActionContext,
  MiraEditorToolbarDefinition,
  MiraEditorEditMode,
  MiraFeatureFlags,
} from "./features";
import type { MiraFrontmatterConfig, MiraOutlineVariant } from "@lapismd/mira";

export type { MiraEditorEditMode } from "./features";
export type { MiraFrontmatterConfig, MiraOutlineVariant } from "@lapismd/mira";

export type MiraEditorProps = {
  value?: string;
  mode?: MiraMode;
  defaultEditMode?: MiraEditorEditMode;
  readonly?: boolean;
  placeholder?: string;
  lineWrapping?: boolean;
  spellcheck?: boolean;
  indentGuides?: boolean;
  indentWithTabs?: boolean;
  indentWidth?: number;
  theme?: MiraTheme;
  colorMode?: MiraColorMode;
  sourcePath?: string;
  class?: string;
  editorClass?: string;
  features?: MiraFeatureFlags;
  featureConfigs?: MiraEditorFeatureConfigs;
  toolbarActions?: MiraEditorToolbarAction[];
  toolbars?: MiraEditorToolbarDefinition[];
  extensions?: MiraExtension[];
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
  onModeChange?: (mode: MiraMode) => void;
  onReadonlyChange?: (readonly: boolean) => void;
  onIndentGuidesChange?: (enabled: boolean) => void;
  onIndentWidthChange?: (width: number) => void;
  onIndentWithTabsChange?: (enabled: boolean) => void;
  onFrontmatterChange?: (nextYaml: string, nextValue: string) => void;
};

export type MiraEditorToolbarProps = {
  value?: string;
  mode?: MiraMode;
  defaultEditMode?: MiraEditorEditMode;
  readonly?: boolean;
  class?: string;
  features?: MiraFeatureFlags;
  featureConfigs?: MiraEditorFeatureConfigs;
  toolbarActions?: MiraEditorToolbarAction[];
  toolbars?: MiraEditorToolbarDefinition[];
  modeOptions?: MiraMode[];
  showModeSwitch?: boolean;
  indentGuides?: boolean;
  indentWithTabs?: boolean;
  indentWidth?: number;
  context?: MiraEditorToolbarActionContext;
  onModeChange?: (mode: MiraMode) => void;
  onInsertMarkdown?: (markdown: string) => void;
  onInsertImage?: () => void;
  onIndentGuidesChange?: (enabled: boolean) => void;
  onIndentWidthChange?: (width: number) => void;
  onIndentWithTabsChange?: (enabled: boolean) => void;
};

export type MiraEditorHandle = {
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
