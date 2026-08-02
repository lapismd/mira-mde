import type { MiraEditorSelection } from "@mira-mde/core";
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
} from "@mira-mde/extensions";
import type {
  MiraDefaultFeatureConfigs,
  MiraDefaultToolbarAction,
  MiraDefaultToolbarActionContext,
  MiraDefaultToolbarDefinition,
  MiraDefaultEditMode,
  MiraFeatureFlags,
} from "./features";
import type {
  MiraFrontmatterConfig,
  MiraOutlineVariant,
} from "@mira-mde/svelte";

export type { MiraDefaultEditMode } from "./features";
export type {
  MiraFrontmatterConfig,
  MiraOutlineVariant,
} from "@mira-mde/svelte";

export type MiraDefaultMdeProps = {
  value?: string;
  mode?: MiraMode;
  defaultEditMode?: MiraDefaultEditMode;
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
  editorClass?: string;
  features?: MiraFeatureFlags;
  featureConfigs?: MiraDefaultFeatureConfigs;
  toolbarActions?: MiraDefaultToolbarAction[];
  toolbars?: MiraDefaultToolbarDefinition[];
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

export type MiraDefaultToolbarProps = {
  value?: string;
  mode?: MiraMode;
  defaultEditMode?: MiraDefaultEditMode;
  readonly?: boolean;
  class?: string;
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
  onInsertImage?: () => void;
  onIndentGuidesChange?: (enabled: boolean) => void;
  onIndentWidthChange?: (width: number) => void;
  onIndentWithTabsChange?: (enabled: boolean) => void;
};

export type MiraDefaultEditorOptions = Omit<MiraDefaultMdeProps, "class"> & {
  root: HTMLElement;
  class?: string;
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

export type MiraDefaultEditor = {
  destroy: () => void;
  executeCommand: (commandId: string) => boolean;
  focus: () => void;
  getCommands: () => readonly MiraCommand[];
  getMarkdown: () => string;
  getMode: () => MiraMode;
  getSelection: () => MiraEditorSelection | null;
  insertImage: () => void;
  insertMarkdown: (markdown: string, selection?: MiraTemplateSelection) => void;
  isCommandEnabled: (commandId: string) => boolean;
  on: <EventName extends MiraDefaultEditorEventName>(
    event: EventName,
    handler: MiraDefaultEditorEventHandler<EventName>,
  ) => () => void;
  setMarkdown: (markdown: string) => void;
  setMode: (mode: MiraMode) => void;
  setReadonly: (readonly: boolean) => void;
  setSelection: (selection: MiraEditorSelection) => void;
  update: (props: Partial<Omit<MiraDefaultEditorOptions, "root">>) => void;
};

export type MiraDefaultMdeHandle = Omit<
  MiraDefaultEditor,
  "destroy" | "on" | "update"
>;
