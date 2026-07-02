import { mermaidExtension } from "@mira-mde/plugin-mermaid";
import type { Component } from "svelte";
import type { MiraEditorSelection } from "@mira-mde/core";
import {
  createSlashSnippet,
  type MiraExtension,
  type MiraMode,
  type MiraSlashCommand,
} from "@mira-mde/extensions";

export type MiraDefaultEditMode = Extract<MiraMode, "live-preview" | "source">;

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
  getIndentGuides?: () => boolean;
  getIndentWidth?: () => number;
  getIndentWithTabs?: () => boolean;
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

export type MiraDefaultSlashCommandId =
  | "heading1"
  | "heading2"
  | "heading3"
  | "numberedList"
  | "bulletList"
  | "taskList"
  | "quote"
  | "callout"
  | "code"
  | "math"
  | "table"
  | "gridTable"
  | "mermaid";

export type MiraDefaultSlashCommandConfig = {
  commands?: MiraSlashCommand[];
  disableDefaultCommands?: MiraDefaultSlashCommandId[] | true;
};

export type MiraDefaultFeatureConfigs = {
  [MiraFeature.Toolbar]?: MiraDefaultToolbarConfig;
  [MiraFeature.Mermaid]?: MiraDefaultMermaidConfig;
  [MiraFeature.SlashCommands]?: MiraDefaultSlashCommandConfig;
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
  [MiraFeature.SlashCommands]: true,
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

const defaultSlashCommands: Array<
  MiraSlashCommand & { id: MiraDefaultSlashCommandId }
> = [
  createSlashSnippet({
    id: "heading1",
    label: "Heading 1",
    description: "Large section heading",
    group: "Basic",
    keywords: ["h1", "title"],
    markdown: "# <|>",
  }),
  createSlashSnippet({
    id: "heading2",
    label: "Heading 2",
    description: "Section heading",
    group: "Basic",
    keywords: ["h2"],
    markdown: "## <|>",
  }),
  createSlashSnippet({
    id: "heading3",
    label: "Heading 3",
    description: "Subsection heading",
    group: "Basic",
    keywords: ["h3"],
    markdown: "### <|>",
  }),
  createSlashSnippet({
    id: "numberedList",
    label: "Numbered list",
    description: "Start an ordered list",
    group: "Basic",
    keywords: ["ordered list", "ol"],
    markdown: "1. <|>",
  }),
  createSlashSnippet({
    id: "bulletList",
    label: "Bullet list",
    description: "Start an unordered list",
    group: "Basic",
    keywords: ["unordered list", "ul"],
    markdown: "- <|>",
  }),
  createSlashSnippet({
    id: "taskList",
    label: "Task list",
    description: "Start a checklist",
    group: "Basic",
    keywords: ["checkbox", "todo"],
    markdown: "- [ ] <|>",
  }),
  createSlashSnippet({
    id: "quote",
    label: "Blockquote",
    description: "Start a quote block",
    group: "Basic",
    keywords: ["quote"],
    markdown: "> <|>",
  }),
  createSlashSnippet({
    id: "callout",
    label: "Callout",
    description: "Insert an Obsidian-style callout",
    group: "Basic",
    keywords: ["admonition", "note"],
    markdown: "> [!note] <|>\n> ",
  }),
  createSlashSnippet({
    id: "code",
    label: "Code block",
    description: "Insert a fenced code block",
    group: "Blocks",
    keywords: ["fence", "pre"],
    markdown: "```\n<|>\n```",
  }),
  createSlashSnippet({
    id: "math",
    label: "Math block",
    description: "Insert a KaTeX block",
    group: "Blocks",
    keywords: ["katex", "latex", "equation"],
    markdown: "$$\n<|>\n$$",
  }),
  createSlashSnippet({
    id: "table",
    label: "Table",
    description: "Insert a pipe table",
    group: "Blocks",
    keywords: ["pipe table"],
    markdown: "| Column | Value |\n| --- | --- |\n| Item | Detail |\n",
  }),
  createSlashSnippet({
    id: "gridTable",
    label: "Grid table",
    description: "Insert a grid table",
    group: "Blocks",
    keywords: ["rst table"],
    markdown:
      "+--------+--------+\n| Column | Value  |\n+========+========+\n| Item   | Detail |\n+--------+--------+\n",
  }),
  createSlashSnippet({
    id: "mermaid",
    label: "Mermaid diagram",
    description: "Insert a Mermaid fenced block",
    group: "Blocks",
    keywords: ["diagram", "flowchart"],
    markdown: "```mermaid\nflowchart TD\n  <|>A[Start] --> B[Done]\n```\n",
  }),
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

  if (resolvedFeatures[MiraFeature.SlashCommands]) {
    const slashCommands = resolveMiraDefaultSlashCommands({
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

export function resolveMiraDefaultSlashCommands({
  featureConfigs = {},
  features = {},
}: {
  featureConfigs?: MiraDefaultFeatureConfigs;
  features?: MiraFeatureFlags;
} = {}): MiraSlashCommand[] {
  const resolvedFeatures = resolveMiraDefaultFeatures(features);
  const config = featureConfigs[MiraFeature.SlashCommands];
  const defaultCommands = defaultSlashCommands
    .filter((command) =>
      isDefaultSlashCommandEnabled(command.id, config?.disableDefaultCommands),
    )
    .filter((command) => isSlashCommandAvailable(command.id, resolvedFeatures));

  return [...defaultCommands, ...(config?.commands ?? [])];
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

function isDefaultSlashCommandEnabled(
  command: MiraDefaultSlashCommandId,
  disabled: MiraDefaultSlashCommandId[] | true | undefined,
): boolean {
  return disabled === true ? false : !disabled?.includes(command);
}

function isSlashCommandAvailable(
  command: MiraDefaultSlashCommandId,
  features: ResolvedMiraDefaultFeatures,
): boolean {
  switch (command) {
    case "heading1":
    case "heading2":
    case "heading3":
      return features[MiraFeature.Headings];
    case "numberedList":
    case "bulletList":
    case "taskList":
    case "quote":
    case "callout":
      return features[MiraFeature.Lists];
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
