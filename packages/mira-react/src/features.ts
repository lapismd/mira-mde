import { mermaidExtension } from "@lapismd/mira-plugin-mermaid";
import {
  resolveMiraEditorSlashCommands as resolveBaseMiraEditorSlashCommands,
  type MiraEditorFeatureConfigs as BaseMiraEditorFeatureConfigs,
  type MiraFeatureFlags as BaseMiraFeatureFlags,
} from "@lapismd/mira-editor";
import type { MiraExtension, MiraMode } from "@lapismd/mira/extensions";
import type {
  MiraEditorEditMode,
  MiraEditorFeatureConfigs,
  MiraEditorToolbarAction,
  MiraEditorToolbarDefinition,
  MiraEditorToolbarItem,
  MiraFeatureFlags,
  ResolvedMiraEditorFeatures,
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
  SlashCommands: "slash-commands",
  BlockControls: "block-controls",
  SourceMode: "source-mode",
  LivePreviewMode: "live-preview-mode",
  PreviewMode: "preview-mode",
  SplitMode: "split-mode",
} as const;

export const defaultMiraEditorFeatures: ResolvedMiraEditorFeatures = {
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
  [MiraFeature.SlashCommands]: true,
  [MiraFeature.BlockControls]: true,
  [MiraFeature.SourceMode]: true,
  [MiraFeature.LivePreviewMode]: true,
  [MiraFeature.PreviewMode]: true,
  [MiraFeature.SplitMode]: true,
};

export const defaultMiraEditorEditMode: MiraEditorEditMode = "live-preview";

const defaultToolbarItems: MiraEditorToolbarItem[] = [
  "heading",
  "bold",
  "italic",
  "quote",
  "bulletList",
  "taskList",
  "link",
  "image",
  "table",
  "gridTable",
  "code",
  "math",
  "mermaid",
];

export function resolveMiraEditorFeatures(
  features: MiraFeatureFlags = {},
): ResolvedMiraEditorFeatures {
  return {
    ...defaultMiraEditorFeatures,
    ...features,
  };
}

export function createMiraEditorExtensions({
  featureConfigs = {},
  features = {},
}: {
  featureConfigs?: MiraEditorFeatureConfigs;
  features?: MiraFeatureFlags;
} = {}): MiraExtension[] {
  const resolvedFeatures = resolveMiraEditorFeatures(features);
  const extensions: MiraExtension[] = [];

  if (
    resolvedFeatures[MiraFeature.Mermaid] &&
    featureConfigs[MiraFeature.Mermaid]?.enabled !== false
  ) {
    extensions.push(mermaidExtension());
  }

  if (resolvedFeatures[MiraFeature.SlashCommands]) {
    const slashCommands = resolveMiraEditorSlashCommands({
      featureConfigs,
      features,
    });
    if (slashCommands.length > 0) {
      extensions.push({
        name: "default-slash-commands",
        slashCommands,
      });
    }
  }

  return extensions;
}

export function resolveMiraEditorSlashCommands({
  featureConfigs = {},
  features = {},
}: {
  featureConfigs?: MiraEditorFeatureConfigs;
  features?: MiraFeatureFlags;
} = {}) {
  return resolveBaseMiraEditorSlashCommands({
    featureConfigs: featureConfigs as BaseMiraEditorFeatureConfigs,
    features: features as BaseMiraFeatureFlags,
  });
}

export function resolveMiraEditorToolbarItems({
  featureConfigs = {},
  features = {},
}: {
  featureConfigs?: MiraEditorFeatureConfigs;
  features?: MiraFeatureFlags;
} = {}): MiraEditorToolbarItem[] {
  const resolvedFeatures = resolveMiraEditorFeatures(features);
  const configuredItems =
    featureConfigs[MiraFeature.Toolbar]?.items ?? defaultToolbarItems;

  return configuredItems.filter((item) =>
    isToolbarItemAvailable(item, resolvedFeatures),
  );
}

export function resolveMiraEditorToolbarActions({
  featureConfigs = {},
  toolbarActions = [],
}: {
  featureConfigs?: MiraEditorFeatureConfigs;
  toolbarActions?: MiraEditorToolbarAction[];
} = {}): MiraEditorToolbarAction[] {
  return [
    ...(featureConfigs[MiraFeature.Toolbar]?.actions ?? []),
    ...toolbarActions,
  ];
}

export function resolveMiraEditorToolbarDefinitions({
  featureConfigs = {},
  toolbars = [],
}: {
  featureConfigs?: MiraEditorFeatureConfigs;
  toolbars?: MiraEditorToolbarDefinition[];
} = {}): MiraEditorToolbarDefinition[] {
  return [
    ...(featureConfigs[MiraFeature.Toolbar]?.toolbars ?? []),
    ...toolbars,
  ];
}

export function resolveMiraEditorModes(
  features: MiraFeatureFlags = {},
): MiraMode[] {
  const resolvedFeatures = resolveMiraEditorFeatures(features);
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

export function resolveMiraEditorEditMode(
  defaultEditMode: MiraEditorEditMode = defaultMiraEditorEditMode,
  modeOptions: MiraMode[] = resolveMiraEditorModes(),
): MiraEditorEditMode {
  if (modeOptions.includes(defaultEditMode)) {
    return defaultEditMode;
  }
  if (modeOptions.includes(defaultMiraEditorEditMode)) {
    return defaultMiraEditorEditMode;
  }
  if (modeOptions.includes("source")) {
    return "source";
  }
  return defaultMiraEditorEditMode;
}

function isToolbarItemAvailable(
  item: MiraEditorToolbarItem,
  features: ResolvedMiraEditorFeatures,
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
    case "image":
      return features[MiraFeature.Images];
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
