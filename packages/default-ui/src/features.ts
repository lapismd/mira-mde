import { mermaidExtension } from "@mira-mde/plugin-mermaid";
import type { Component } from "svelte";
import type { MiraEditorSelection } from "@mira-mde/core";
import type { MiraExtension, MiraMode } from "@mira-mde/extensions";

export const MiraFeature = {
  Toolbar: "toolbar",
  ModeSwitch: "mode-switch",
  Formatting: "formatting",
  Headings: "headings",
  Lists: "lists",
  Links: "links",
  Tables: "tables",
  GridTables: "grid-tables",
  Mermaid: "mermaid",
  Code: "code",
  Math: "math",
  Frontmatter: "frontmatter",
  Images: "images",
  Embeds: "embeds",
  Wikilinks: "wikilinks",
  Tags: "tags",
  SourceMode: "source-mode",
  LivePreviewMode: "live-preview-mode",
  PreviewMode: "preview-mode",
  SplitMode: "split-mode",
} as const;

export type MiraFeatureName = (typeof MiraFeature)[keyof typeof MiraFeature];

export type MiraFeatureFlags = Partial<Record<MiraFeatureName, boolean>>;

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
  getMarkdown: () => string;
  getMode: () => MiraMode;
  getSelection: () => MiraEditorSelection | null;
  insertMarkdown: (markdown: string) => void;
  setMarkdown: (markdown: string) => void;
  setMode: (mode: MiraMode) => void;
  setReadonly: (readonly: boolean) => void;
  setSelection: (selection: MiraEditorSelection) => void;
};

type MiraDefaultToolbarDynamicBoolean =
  | boolean
  | ((context: MiraDefaultToolbarActionContext) => boolean);

export type MiraDefaultToolbarMenuAction = {
  type?: "item";
  id: string;
  label: string;
  icon?: Component<Record<string, unknown>>;
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
  icon: Component<Record<string, unknown>>;
  tooltip?: string;
  disabled?: MiraDefaultToolbarDynamicBoolean;
  pressed?: MiraDefaultToolbarDynamicBoolean;
  run: (context: MiraDefaultToolbarActionContext) => void;
};

export type MiraDefaultToolbarDropdownAction = {
  type: "dropdown";
  id: string;
  label: string;
  icon: Component<Record<string, unknown>>;
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
  [MiraFeature.Toolbar]?: MiraDefaultToolbarConfig;
  [MiraFeature.Mermaid]?: MiraDefaultMermaidConfig;
};

export type ResolvedMiraDefaultFeatures = Record<MiraFeatureName, boolean>;

export const defaultMiraFeatures: ResolvedMiraDefaultFeatures = {
  [MiraFeature.Toolbar]: true,
  [MiraFeature.ModeSwitch]: true,
  [MiraFeature.Formatting]: true,
  [MiraFeature.Headings]: true,
  [MiraFeature.Lists]: true,
  [MiraFeature.Links]: true,
  [MiraFeature.Tables]: true,
  [MiraFeature.GridTables]: true,
  [MiraFeature.Mermaid]: true,
  [MiraFeature.Code]: true,
  [MiraFeature.Math]: true,
  [MiraFeature.Frontmatter]: true,
  [MiraFeature.Images]: true,
  [MiraFeature.Embeds]: true,
  [MiraFeature.Wikilinks]: true,
  [MiraFeature.Tags]: true,
  [MiraFeature.SourceMode]: true,
  [MiraFeature.LivePreviewMode]: true,
  [MiraFeature.PreviewMode]: true,
  [MiraFeature.SplitMode]: true,
};

const defaultToolbarItems: MiraDefaultToolbarItem[] = [
  "heading",
  "bold",
  "italic",
  "quote",
  "bulletList",
  "taskList",
  "link",
  "table",
  "gridTable",
  "code",
  "math",
  "mermaid",
];

export function resolveMiraDefaultFeatures(
  features: MiraFeatureFlags = {},
): ResolvedMiraDefaultFeatures {
  return {
    ...defaultMiraFeatures,
    ...features,
  };
}

export function createMiraDefaultExtensions({
  featureConfigs = {},
  features = {},
}: {
  featureConfigs?: MiraDefaultFeatureConfigs;
  features?: MiraFeatureFlags;
} = {}): MiraExtension[] {
  const resolvedFeatures = resolveMiraDefaultFeatures(features);
  const extensions: MiraExtension[] = [];

  if (
    resolvedFeatures[MiraFeature.Mermaid] &&
    featureConfigs[MiraFeature.Mermaid]?.enabled !== false
  ) {
    extensions.push(mermaidExtension());
  }

  return extensions;
}

export function resolveMiraDefaultToolbarItems({
  featureConfigs = {},
  features = {},
}: {
  featureConfigs?: MiraDefaultFeatureConfigs;
  features?: MiraFeatureFlags;
} = {}): MiraDefaultToolbarItem[] {
  const resolvedFeatures = resolveMiraDefaultFeatures(features);
  const configuredItems =
    featureConfigs[MiraFeature.Toolbar]?.items ?? defaultToolbarItems;

  return configuredItems.filter((item) =>
    isToolbarItemAvailable(item, resolvedFeatures),
  );
}

export function resolveMiraDefaultToolbarActions({
  featureConfigs = {},
  toolbarActions = [],
}: {
  featureConfigs?: MiraDefaultFeatureConfigs;
  toolbarActions?: MiraDefaultToolbarAction[];
} = {}): MiraDefaultToolbarAction[] {
  return [
    ...(featureConfigs[MiraFeature.Toolbar]?.actions ?? []),
    ...toolbarActions,
  ];
}

export function resolveMiraDefaultToolbarDefinitions({
  featureConfigs = {},
  toolbars = [],
}: {
  featureConfigs?: MiraDefaultFeatureConfigs;
  toolbars?: MiraDefaultToolbarDefinition[];
} = {}): MiraDefaultToolbarDefinition[] {
  return [
    ...(featureConfigs[MiraFeature.Toolbar]?.toolbars ?? []),
    ...toolbars,
  ];
}

export function resolveMiraDefaultModes(
  features: MiraFeatureFlags = {},
): MiraMode[] {
  const resolvedFeatures = resolveMiraDefaultFeatures(features);
  const modes: MiraMode[] = [];

  if (resolvedFeatures[MiraFeature.SourceMode]) {
    modes.push("source");
  }
  if (resolvedFeatures[MiraFeature.LivePreviewMode]) {
    modes.push("live-preview");
  }
  if (resolvedFeatures[MiraFeature.PreviewMode]) {
    modes.push("preview");
  }
  if (resolvedFeatures[MiraFeature.SplitMode]) {
    modes.push("split");
  }

  return modes;
}

function isToolbarItemAvailable(
  item: MiraDefaultToolbarItem,
  features: ResolvedMiraDefaultFeatures,
): boolean {
  switch (item) {
    case "bold":
    case "italic":
      return features[MiraFeature.Formatting];
    case "heading":
      return features[MiraFeature.Headings];
    case "quote":
    case "bulletList":
    case "taskList":
      return features[MiraFeature.Lists];
    case "link":
      return features[MiraFeature.Links];
    case "table":
      return features[MiraFeature.Tables];
    case "gridTable":
      return features[MiraFeature.GridTables];
    case "mermaid":
      return features[MiraFeature.Mermaid];
    case "code":
      return features[MiraFeature.Code];
    case "math":
      return features[MiraFeature.Math];
  }
}
