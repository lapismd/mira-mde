import { mermaidExtension } from "@mira-mde/plugin-mermaid";
import type { MiraExtension, MiraMode } from "@mira-mde/extensions";
import type {
  MiraDefaultEditMode,
  MiraDefaultFeatureConfigs,
  MiraDefaultToolbarAction,
  MiraDefaultToolbarDefinition,
  MiraDefaultToolbarItem,
  MiraFeatureFlags,
  ResolvedMiraDefaultFeatures,
} from "./types";

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

export const defaultMiraEditMode: MiraDefaultEditMode = "live-preview";

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

export function resolveMiraDefaultEditMode(
  defaultEditMode: MiraDefaultEditMode = defaultMiraEditMode,
  modeOptions: MiraMode[] = resolveMiraDefaultModes(),
): MiraDefaultEditMode {
  if (modeOptions.includes(defaultEditMode)) {
    return defaultEditMode;
  }
  if (modeOptions.includes(defaultMiraEditMode)) {
    return defaultMiraEditMode;
  }
  if (modeOptions.includes("source")) {
    return "source";
  }
  return defaultMiraEditMode;
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
