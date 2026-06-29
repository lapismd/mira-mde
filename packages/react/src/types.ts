import type { MiraEditorSelection } from "@mira-mde/core";
import type {
  MiraAssetResolver,
  MiraExtension,
  MiraFileAdapter,
  MiraLinkResolver,
  MiraMode,
  MiraTheme,
  MiraThemeConfig,
} from "@mira-mde/extensions";
import type {
  MiraDefaultSlashCommandConfig,
  MiraDefaultSlashCommandId,
} from "@mira-mde/default-ui";
import type { ComponentType } from "react";

export type MiraFrontmatterConfig = {
  types?: Record<string, unknown>;
  properties?: Record<string, unknown>;
  widgets?: unknown[];
};

export type MiraReactIcon = ComponentType<{
  "aria-hidden"?: boolean | "true" | "false";
  className?: string;
}>;

export type MiraDefaultEditMode = Extract<MiraMode, "live-preview" | "source">;

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

export type MiraMdeProps = {
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
  indentGuides?: boolean;
  indentWithTabs?: boolean;
  indentWidth?: number;
  theme?: MiraTheme;
  themeConfig?: MiraThemeConfig;
  sourcePath?: string;
  className?: string;
  toolbar?: boolean;
  linkResolver?: MiraLinkResolver;
  assetResolver?: MiraAssetResolver;
  fileAdapter?: MiraFileAdapter;
  frontmatterOpen?: boolean;
  frontmatterConfig?: MiraFrontmatterConfig;
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
  | "source-mode"
  | "live-preview-mode"
  | "preview-mode"
  | "split-mode";

export type MiraFeatureFlags = Partial<Record<MiraFeatureName, boolean>>;

export type ResolvedMiraDefaultFeatures = Record<MiraFeatureName, boolean>;

export type MiraDefaultToolbarItem =
  | "heading"
  | "bold"
  | "italic"
  | "quote"
  | "bulletList"
  | "taskList"
  | "link"
  | "table"
  | "gridTable"
  | "code"
  | "math"
  | "mermaid";

export type MiraDefaultToolbarActionContext = {
  value: string;
  mode: MiraMode;
  readonly: boolean;
  focus: () => void;
  getIndentGuides?: () => boolean;
  getIndentWidth?: () => number;
  getIndentWithTabs?: () => boolean;
  getMarkdown: () => string;
  getMode: () => MiraMode;
  getSelection: () => MiraEditorSelection | null;
  insertMarkdown: (markdown: string) => void;
  setIndentGuides?: (enabled: boolean) => void;
  setIndentWidth?: (width: number) => void;
  setIndentWithTabs?: (enabled: boolean) => void;
  setMarkdown: (markdown: string) => void;
  setMode: (mode: MiraMode) => void;
  setReadonly: (readonly: boolean) => void;
  setSelection: (selection: MiraEditorSelection) => void;
};

export type MiraDefaultToolbarDynamicBoolean =
  | boolean
  | ((context: MiraDefaultToolbarActionContext) => boolean);

export type MiraDefaultToolbarMenuAction = {
  type?: "item";
  id: string;
  label: string;
  icon?: MiraReactIcon;
  shortcut?: string;
  checked?: MiraDefaultToolbarDynamicBoolean;
  disabled?: MiraDefaultToolbarDynamicBoolean;
  run: (context: MiraDefaultToolbarActionContext) => void;
};

export type MiraDefaultToolbarMenuLabel = {
  type: "label";
  id?: string;
  label: string;
};

export type MiraDefaultToolbarMenuSeparator = {
  type: "separator";
  id?: string;
};

export type MiraDefaultToolbarMenuItem =
  | MiraDefaultToolbarMenuAction
  | MiraDefaultToolbarMenuLabel
  | MiraDefaultToolbarMenuSeparator;

export type MiraDefaultToolbarButtonAction = {
  type?: "button";
  id: string;
  label: string;
  icon: MiraReactIcon;
  tooltip?: string;
  disabled?: MiraDefaultToolbarDynamicBoolean;
  pressed?: MiraDefaultToolbarDynamicBoolean;
  run: (context: MiraDefaultToolbarActionContext) => void;
};

export type MiraDefaultToolbarDropdownAction = {
  type: "dropdown";
  id: string;
  label: string;
  icon: MiraReactIcon;
  tooltip?: string;
  disabled?: MiraDefaultToolbarDynamicBoolean;
  items: MiraDefaultToolbarMenuItem[];
};

export type MiraDefaultToolbarAction =
  | MiraDefaultToolbarButtonAction
  | MiraDefaultToolbarDropdownAction;

export type MiraDefaultToolbarDefinition = {
  id: string;
  label?: string;
  align?: "start" | "end";
  items: MiraDefaultToolbarAction[];
};

export type MiraDefaultToolbarConfig = {
  items?: MiraDefaultToolbarItem[];
  actions?: MiraDefaultToolbarAction[];
  toolbars?: MiraDefaultToolbarDefinition[];
};

export type MiraDefaultMermaidConfig = {
  enabled?: boolean;
};

export type MiraDefaultFeatureConfigs = {
  toolbar?: MiraDefaultToolbarConfig;
  mermaid?: MiraDefaultMermaidConfig;
  "slash-commands"?: MiraDefaultSlashCommandConfig;
};

export type { MiraDefaultSlashCommandConfig, MiraDefaultSlashCommandId };

export type MiraDefaultToolbarProps = {
  value?: string;
  mode?: MiraMode;
  defaultEditMode?: MiraDefaultEditMode;
  readonly?: boolean;
  className?: string;
  features?: MiraFeatureFlags;
  featureConfigs?: MiraDefaultFeatureConfigs;
  toolbarActions?: MiraDefaultToolbarAction[];
  toolbars?: MiraDefaultToolbarDefinition[];
  modeOptions?: MiraMode[];
  showModeSwitch?: boolean;
  indentGuides?: boolean;
  indentWithTabs?: boolean;
  indentWidth?: number;
  context?: MiraDefaultToolbarActionContext;
  onModeChange?: (mode: MiraMode) => void;
  onInsertMarkdown?: (markdown: string) => void;
  onIndentGuidesChange?: (enabled: boolean) => void;
  onIndentWidthChange?: (width: number) => void;
  onIndentWithTabsChange?: (enabled: boolean) => void;
};

export type MiraDefaultMdeProps = Omit<MiraMdeProps, "toolbar"> & {
  defaultEditMode?: MiraDefaultEditMode;
  editorClassName?: string;
  features?: MiraFeatureFlags;
  featureConfigs?: MiraDefaultFeatureConfigs;
  toolbarActions?: MiraDefaultToolbarAction[];
  toolbars?: MiraDefaultToolbarDefinition[];
  onIndentGuidesChange?: (enabled: boolean) => void;
  onIndentWidthChange?: (width: number) => void;
  onIndentWithTabsChange?: (enabled: boolean) => void;
};

export type MiraDefaultMdeHandle = MiraMdeHandle;

export type MiraDefaultEditorOptions = Omit<
  MiraDefaultMdeProps,
  "className"
> & {
  root: HTMLElement;
  className?: string;
};

export type MiraDefaultEditorEventMap = {
  change: string;
  modeChange: MiraMode;
  readonlyChange: boolean;
};

export type MiraDefaultEditorEventName = keyof MiraDefaultEditorEventMap;

export type MiraDefaultEditorEventHandler<
  EventName extends MiraDefaultEditorEventName,
> = (payload: MiraDefaultEditorEventMap[EventName]) => void;

export type MiraDefaultEditor = MiraDefaultMdeHandle & {
  destroy: () => void;
  on: <EventName extends MiraDefaultEditorEventName>(
    event: EventName,
    handler: MiraDefaultEditorEventHandler<EventName>,
  ) => () => void;
  update: (props: Partial<Omit<MiraDefaultEditorOptions, "root">>) => void;
};
