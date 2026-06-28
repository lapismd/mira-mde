import type { MiraEditorSelection } from "@mira-mde/core";
import type {
  MiraAssetResolver,
  MiraExtension,
  MiraLinkResolver,
  MiraMode,
  MiraTheme,
} from "@mira-mde/extensions";
import type {
  MiraDefaultFeatureConfigs,
  MiraDefaultToolbarAction,
  MiraDefaultToolbarActionContext,
  MiraDefaultToolbarDefinition,
  MiraFeatureFlags,
} from "./features";

export type MiraDefaultMdeProps = {
  value?: string;
  mode?: MiraMode;
  readonly?: boolean;
  placeholder?: string;
  lineWrapping?: boolean;
  spellcheck?: boolean;
  theme?: MiraTheme;
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
  frontmatterOpen?: boolean;
  onChange?: (value: string) => void;
  onModeChange?: (mode: MiraMode) => void;
  onReadonlyChange?: (readonly: boolean) => void;
  onFrontmatterChange?: (nextYaml: string, nextValue: string) => void;
};

export type MiraDefaultToolbarProps = {
  value?: string;
  mode?: MiraMode;
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
