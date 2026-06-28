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
  MiraDefaultFeatureConfigs,
  MiraDefaultToolbarAction,
  MiraDefaultToolbarActionContext,
  MiraDefaultToolbarDefinition,
  MiraDefaultEditMode,
  MiraFeatureFlags,
} from "./features";

export type { MiraDefaultEditMode } from "./features";

export type MiraFrontmatterConfig = {
  types?: Record<string, unknown>;
  properties?: Record<string, unknown>;
  widgets?: unknown[];
};

export type MiraDefaultMdeProps = {
  value?: string;
  mode?: MiraMode;
  defaultEditMode?: MiraDefaultEditMode;
  readonly?: boolean;
  placeholder?: string;
  lineWrapping?: boolean;
  spellcheck?: boolean;
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
  frontmatterOpen?: boolean;
  frontmatterConfig?: MiraFrontmatterConfig;
  onChange?: (value: string) => void;
  onModeChange?: (mode: MiraMode) => void;
  onReadonlyChange?: (readonly: boolean) => void;
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
  context?: MiraDefaultToolbarActionContext;
  onModeChange?: (mode: MiraMode) => void;
  onInsertMarkdown?: (markdown: string) => void;
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
  focus: () => void;
  getMarkdown: () => string;
  getMode: () => MiraMode;
  getSelection: () => MiraEditorSelection | null;
  insertMarkdown: (markdown: string) => void;
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
