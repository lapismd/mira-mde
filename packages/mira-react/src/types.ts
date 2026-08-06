import type {
  MiraEditorSelection,
  MiraMarkdownActionId,
} from "@lapismd/mira/core";
import type {
  MiraAssetResolver,
  MiraBlockControlsOptions,
  MiraBlockToolbarConfig,
  MiraCommand,
  MiraExtension,
  MiraFileAdapter,
  MiraImageConfig,
  MiraLinkResolver,
  MiraMarkdownAuthoringConfig,
  MiraMode,
  MiraMarkdownBlockHandle,
  MiraMarkdownBlockRange,
  MiraColorMode,
  MiraTheme,
  MiraTemplateSelection,
  MiraTextRange,
  MiraToolbarPlacement,
} from "@lapismd/mira/extensions";
import type {
  MiraEditorSlashCommandConfig,
  MiraEditorSlashCommandId,
} from "@lapismd/mira-editor";
import type {
  FrontmatterConfig,
  MarkdownOutlineVariant,
} from "@lapismd/mira/preview";
import type { ComponentType } from "react";

export type MiraFrontmatterConfig = FrontmatterConfig;
export type MiraOutlineVariant = MarkdownOutlineVariant;

export type MiraReactIcon = ComponentType<{
  "aria-hidden"?: boolean | "true" | "false";
  className?: string;
}>;

export type MiraEditorEditMode = Extract<MiraMode, "live-preview" | "source">;

export type MiraHandle = {
  applyMarkdownAction: (action: MiraMarkdownActionId) => boolean;
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

export type MiraProps = {
  value?: string;
  defaultValue?: string;
  mode?: MiraMode;
  defaultMode?: MiraMode;
  extensions?: MiraExtension[];
  readonly?: boolean;
  defaultReadonly?: boolean;
  placeholder?: string;
  lineWrapping?: boolean;
  spellcheck?: boolean;
  blockControls?: boolean | MiraBlockControlsOptions;
  indentGuides?: boolean;
  indentWithTabs?: boolean;
  indentWidth?: number;
  theme?: MiraTheme;
  colorMode?: MiraColorMode;
  sourcePath?: string;
  className?: string;
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
  onModeChange?: (mode: MiraMode) => void;
  onReadonlyChange?: (readonly: boolean) => void;
  onFrontmatterChange?: (nextYaml: string, nextValue: string) => void;
};

export type MiraFeatureName =
  | "toolbar"
  | "mode-switch"
  | "formatting"
  | "headings"
  | "lists"
  | "links"
  | "tables"
  | "grid-tables"
  | "mermaid"
  | "code"
  | "math"
  | "frontmatter"
  | "images"
  | "embeds"
  | "wikilinks"
  | "tags"
  | "slash-commands"
  | "block-controls"
  | "source-mode"
  | "live-preview-mode"
  | "preview-mode"
  | "split-mode";

export type MiraFeatureFlags = Partial<Record<MiraFeatureName, boolean>>;

export type ResolvedMiraEditorFeatures = Record<MiraFeatureName, boolean>;

export type MiraEditorToolbarItem =
  | "heading"
  | "bold"
  | "italic"
  | "strikethrough"
  | "inlineCode"
  | "quote"
  | "bulletList"
  | "numberedList"
  | "taskList"
  | "link"
  | "image"
  | "table"
  | "gridTable"
  | "code"
  | "math"
  | "mermaid";

export type MiraEditorToolbarActionContext = {
  value: string;
  mode: MiraMode;
  readonly: boolean;
  applyMarkdownAction?: (action: MiraMarkdownActionId) => boolean;
  focus: () => void;
  getIndentGuides?: () => boolean;
  getIndentWidth?: () => number;
  getIndentWithTabs?: () => boolean;
  getMarkdown: () => string;
  getMode: () => MiraMode;
  getSelection: () => MiraEditorSelection | null;
  insertImage: () => void;
  insertMarkdown: (markdown: string) => void;
  setIndentGuides?: (enabled: boolean) => void;
  setIndentWidth?: (width: number) => void;
  setIndentWithTabs?: (enabled: boolean) => void;
  setMarkdown: (markdown: string) => void;
  setMode: (mode: MiraMode) => void;
  setReadonly: (readonly: boolean) => void;
  setSelection: (selection: MiraEditorSelection) => void;
  block?: MiraMarkdownBlockRange;
  blocks?: MiraMarkdownBlockRange[];
  handle?: MiraMarkdownBlockHandle;
  affectedRange?: MiraMarkdownBlockRange;
  replaceRange?: (
    markdown: string,
    range: MiraTextRange,
    selection?: MiraTemplateSelection,
  ) => void;
};

export type MiraEditorToolbarPlacement = MiraToolbarPlacement;

export type MiraEditorToolbarDynamicBoolean =
  | boolean
  | ((context: MiraEditorToolbarActionContext) => boolean);

export type MiraEditorToolbarMenuAction = {
  type?: "item";
  id: string;
  label: string;
  icon?: MiraReactIcon;
  shortcut?: string;
  checked?: MiraEditorToolbarDynamicBoolean;
  disabled?: MiraEditorToolbarDynamicBoolean;
  run: (context: MiraEditorToolbarActionContext) => void;
};

export type MiraEditorToolbarMenuLabel = {
  type: "label";
  id?: string;
  label: string;
};

export type MiraEditorToolbarMenuSeparator = {
  type: "separator";
  id?: string;
};

export type MiraEditorToolbarMenuItem =
  | MiraEditorToolbarMenuAction
  | MiraEditorToolbarMenuLabel
  | MiraEditorToolbarMenuSeparator;

export type MiraEditorToolbarButtonAction = {
  type?: "button";
  id: string;
  label: string;
  icon: MiraReactIcon;
  group?: string;
  placements?: readonly MiraEditorToolbarPlacement[];
  shortcut?: string;
  tooltip?: string;
  disabled?: MiraEditorToolbarDynamicBoolean;
  pressed?: MiraEditorToolbarDynamicBoolean;
  run: (context: MiraEditorToolbarActionContext) => void;
};

export type MiraEditorToolbarDropdownAction = {
  type: "dropdown";
  id: string;
  label: string;
  icon: MiraReactIcon;
  tooltip?: string;
  disabled?: MiraEditorToolbarDynamicBoolean;
  items: MiraEditorToolbarMenuItem[];
};

export type MiraEditorToolbarAction =
  | MiraEditorToolbarButtonAction
  | MiraEditorToolbarDropdownAction;

export type MiraEditorToolbarDefinition = {
  id: string;
  label?: string;
  align?: "start" | "end";
  items: MiraEditorToolbarAction[];
};

export type MiraEditorToolbarConfig = {
  items?: MiraEditorToolbarItem[];
  actions?: MiraEditorToolbarAction[];
  toolbars?: MiraEditorToolbarDefinition[];
};

export type MiraEditorMermaidConfig = {
  enabled?: boolean;
};

export type MiraEditorBlockControlsConfig = {
  enabled?: boolean;
  toolbar?: boolean | MiraBlockToolbarConfig;
};

export type MiraEditorFeatureConfigs = {
  toolbar?: MiraEditorToolbarConfig;
  mermaid?: MiraEditorMermaidConfig;
  "block-controls"?: MiraEditorBlockControlsConfig;
  "slash-commands"?: MiraEditorSlashCommandConfig;
};

export type { MiraEditorSlashCommandConfig, MiraEditorSlashCommandId };

export type MiraEditorToolbarProps = {
  value?: string;
  mode?: MiraMode;
  defaultEditMode?: MiraEditorEditMode;
  readonly?: boolean;
  className?: string;
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

export type MiraEditorProps = Omit<MiraProps, "toolbar"> & {
  defaultEditMode?: MiraEditorEditMode;
  editorClassName?: string;
  features?: MiraFeatureFlags;
  featureConfigs?: MiraEditorFeatureConfigs;
  toolbarActions?: MiraEditorToolbarAction[];
  toolbars?: MiraEditorToolbarDefinition[];
  onIndentGuidesChange?: (enabled: boolean) => void;
  onIndentWidthChange?: (width: number) => void;
  onIndentWithTabsChange?: (enabled: boolean) => void;
};

export type MiraEditorHandle = MiraHandle;
