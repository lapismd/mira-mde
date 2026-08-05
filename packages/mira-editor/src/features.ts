import { mermaidExtension } from "@lapismd/mira-plugin-mermaid";
import type { Component } from "svelte";
import type {
  MiraEditorSelection,
  MiraMarkdownActionId,
} from "@lapismd/mira/core";
import {
  createSlashSnippet,
  type MiraExtension,
  type MiraMode,
  type MiraSlashCommand,
} from "@lapismd/mira/extensions";

export type MiraEditorEditMode = Extract<MiraMode, "live-preview" | "source">;

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

export type MiraFeatureName = (typeof MiraFeature)[keyof typeof MiraFeature];

export type MiraFeatureFlags = Partial<Record<MiraFeatureName, boolean>>;

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
  focus: () => void;
  getMarkdown: () => string;
  getMode: () => MiraMode;
  getIndentGuides?: () => boolean;
  getIndentWidth?: () => number;
  getIndentWithTabs?: () => boolean;
  getSelection: () => MiraEditorSelection | null;
  applyMarkdownAction?: (action: MiraMarkdownActionId) => boolean;
  insertMarkdown: (markdown: string) => void;
  insertImage?: () => void;
  setIndentGuides?: (enabled: boolean) => void;
  setIndentWidth?: (width: number) => void;
  setIndentWithTabs?: (enabled: boolean) => void;
  setMarkdown: (markdown: string) => void;
  setMode: (mode: MiraMode) => void;
  setReadonly: (readonly: boolean) => void;
  setSelection: (selection: MiraEditorSelection) => void;
};

type MiraEditorToolbarDynamicBoolean =
  | boolean
  | ((context: MiraEditorToolbarActionContext) => boolean);

export type MiraEditorToolbarMenuAction = {
  type?: "item";
  id: string;
  label: string;
  icon?: Component<Record<string, unknown>>;
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
  icon: Component<Record<string, unknown>>;
  tooltip?: string;
  disabled?: MiraEditorToolbarDynamicBoolean;
  pressed?: MiraEditorToolbarDynamicBoolean;
  run: (context: MiraEditorToolbarActionContext) => void;
};

export type MiraEditorToolbarDropdownAction = {
  type: "dropdown";
  id: string;
  label: string;
  icon: Component<Record<string, unknown>>;
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
};

export type MiraEditorSlashCommandId =
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

export type MiraEditorSlashCommandConfig = {
  commands?: MiraSlashCommand[];
  disableDefaultCommands?: MiraEditorSlashCommandId[] | true;
};

export type MiraEditorFeatureConfigs = {
  [MiraFeature.Toolbar]?: MiraEditorToolbarConfig;
  [MiraFeature.Mermaid]?: MiraEditorMermaidConfig;
  [MiraFeature.BlockControls]?: MiraEditorBlockControlsConfig;
  [MiraFeature.SlashCommands]?: MiraEditorSlashCommandConfig;
};

export type ResolvedMiraEditorFeatures = Record<MiraFeatureName, boolean>;

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
  "strikethrough",
  "inlineCode",
  "quote",
  "bulletList",
  "numberedList",
  "taskList",
  "link",
  "image",
  "table",
  "gridTable",
  "code",
  "math",
  "mermaid",
];

const defaultSlashCommands: Array<
  MiraSlashCommand & { id: MiraEditorSlashCommandId }
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
} = {}): MiraSlashCommand[] {
  const resolvedFeatures = resolveMiraEditorFeatures(features);
  const config = featureConfigs[MiraFeature.SlashCommands];
  const defaultCommands = defaultSlashCommands
    .filter((command) =>
      isDefaultSlashCommandEnabled(command.id, config?.disableDefaultCommands),
    )
    .filter((command) => isSlashCommandAvailable(command.id, resolvedFeatures));

  return [...defaultCommands, ...(config?.commands ?? [])];
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
    case "strikethrough":
      return features[MiraFeature.Formatting];
    case "heading":
      return features[MiraFeature.Headings];
    case "quote":
    case "bulletList":
    case "numberedList":
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
    case "inlineCode":
    case "code":
      return features[MiraFeature.Code];
    case "math":
      return features[MiraFeature.Math];
  }
}

function isDefaultSlashCommandEnabled(
  command: MiraEditorSlashCommandId,
  disabled: MiraEditorSlashCommandId[] | true | undefined,
): boolean {
  return disabled === true ? false : !disabled?.includes(command);
}

function isSlashCommandAvailable(
  command: MiraEditorSlashCommandId,
  features: ResolvedMiraEditorFeatures,
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
