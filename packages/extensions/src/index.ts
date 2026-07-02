import type { LanguageDescription } from "@codemirror/language";
import type { Extension as CodeMirrorExtension } from "@codemirror/state";
import type { Component } from "svelte";
import type { Pluggable } from "unified";

export type MiraRendererComponent =
  | Component<any, any, any>
  | string
  | null
  | undefined;

export type MiraRendererComponents = Record<string, MiraRendererComponent>;

export type MiraTheme = "obsidian" | "system" | "light" | "dark" | "inherit";

export type MiraThemeConfig = {
  root?: HTMLElement | Document;
  lightClassNames?: string[];
  darkClassNames?: string[];
  lightDataThemeValues?: string[];
  darkDataThemeValues?: string[];
  attributeNames?: string[];
  fallback?: Exclude<MiraTheme, "inherit">;
};

export type MiraMode = "source" | "live-preview" | "preview" | "split";

export type MiraCommand = {
  id: string;
  label: string;
  description?: string;
  group?: string;
  keywords?: string[];
  run: (context: MiraExtensionRuntimeContext) => void;
};

export type MiraTextRange = {
  from: number;
  to: number;
};

export type MiraMarkdownBlockKind =
  | "frontmatter"
  | "heading"
  | "paragraph"
  | "list"
  | "blockquote"
  | "code"
  | "math"
  | "table"
  | "grid-table"
  | "embed"
  | "html"
  | "directive"
  | "thematic-break";

export type MiraMarkdownBlockRange = MiraTextRange & {
  id: string;
  kind: MiraMarkdownBlockKind;
  startLine: number;
  endLine: number;
  text: string;
};

export type MiraMarkdownBlockHandleRole =
  | "block"
  | "heading-section"
  | "list-item";

export type MiraMarkdownBlockHandle = {
  id: string;
  role: MiraMarkdownBlockHandleRole;
  handleRange: MiraMarkdownBlockRange;
  affectedRange: MiraMarkdownBlockRange;
  headingLevel?: number;
  listIndent?: number;
  parentId?: string;
};

export type MiraTemplateSelection =
  | number
  | {
      anchor: number;
      head?: number;
    };

export type MiraMarkdownTemplate = {
  markdown: string;
  selection?: MiraTemplateSelection;
};

export type MiraSlashCommandContext = MiraExtensionRuntimeContext & {
  query: string;
  range: MiraTextRange;
  replaceRange: (
    markdown: string,
    range?: Partial<MiraTextRange>,
    selection?: MiraTemplateSelection,
  ) => void;
};

export type MiraSlashCommand = {
  id: string;
  label: string;
  description?: string;
  group?: string;
  keywords?: string[];
  boost?: number;
  insert?: string | MiraMarkdownTemplate;
  run?: (context: MiraSlashCommandContext) => void;
};

export type MiraSlashSnippetOptions<TId extends string = string> = {
  id: TId;
  label: string;
  description?: string;
  group?: string;
  keywords?: string[];
  boost?: number;
  markdown: string;
  marker?: string;
};

export function createMarkdownTemplate(
  markdown: string,
  marker = "<|>",
): MiraMarkdownTemplate {
  if (!marker) {
    return { markdown };
  }

  const selection = markdown.indexOf(marker);
  if (selection === -1) {
    return { markdown };
  }

  return {
    markdown: markdown.replace(marker, ""),
    selection,
  };
}

export function createSlashSnippet<TId extends string = string>(
  options: MiraSlashSnippetOptions<TId>,
): MiraSlashCommand & { id: TId } {
  const { markdown, marker, ...command } = options;

  return {
    ...command,
    insert: createMarkdownTemplate(markdown, marker),
  };
}

export type MiraToolbarItem = {
  id: string;
  label: string;
  command: string;
};

export type MiraBlockActionContext = MiraExtensionRuntimeContext & {
  block: MiraMarkdownBlockRange;
  blocks: MiraMarkdownBlockRange[];
  handle?: MiraMarkdownBlockHandle;
  affectedRange?: MiraMarkdownBlockRange;
  selection: MiraTextRange | null;
  sourcePath?: string;
  replaceRange: (
    markdown: string,
    range: MiraTextRange,
    selection?: MiraTemplateSelection,
  ) => void;
};

type MiraBlockActionDynamicBoolean =
  | boolean
  | ((context: MiraBlockActionContext) => boolean);

export type MiraBlockAction = {
  id: string;
  label: string;
  description?: string;
  destructive?: boolean;
  disabled?: MiraBlockActionDynamicBoolean;
  run: (context: MiraBlockActionContext) => void | Promise<void>;
};

export type MiraLinkResolver = (target: {
  href: string;
  label: string;
  sourcePath?: string;
}) => string | null | undefined;

export type MiraAssetResolver = (target: {
  src: string;
  alt?: string;
  sourcePath?: string;
}) => string | null | undefined;

export type MiraFileRef = {
  path: string;
  name?: string;
  extension?: string;
  kind?: "markdown" | "image" | "media" | "unknown";
};

export type MiraFileAdapter = {
  resolveLink: (target: {
    href: string;
    sourcePath?: string;
  }) => MiraFileRef | null | Promise<MiraFileRef | null>;
  readMarkdown?: (file: MiraFileRef) => string | null | Promise<string | null>;
  readAssetUrl?: (file: MiraFileRef) => string | null | Promise<string | null>;
  openFile?: (file: MiraFileRef, event?: MouseEvent) => void | Promise<void>;
  renderEmbed?: (
    target: { file: MiraFileRef; sourcePath?: string; label?: string },
    element: HTMLElement,
  ) => void | (() => void);
  listFiles?: () => MiraFileRef[] | Promise<MiraFileRef[]>;
  getHeadings?: (
    file: MiraFileRef,
  ) =>
    | Array<{ id: string; text: string; level: number }>
    | Promise<Array<{ id: string; text: string; level: number }>>;
  watchFile?: (file: MiraFileRef, callback: () => void) => void | (() => void);
};

export type MiraExtensionRuntimeContext = {
  view?: unknown;
  getValue: () => string;
  setValue: (value: string) => void;
  focus: () => void;
  insertMarkdown: (markdown: string, selection?: MiraTemplateSelection) => void;
};

export type MiraExtensionContext = {
  readonly mode: MiraMode;
  readonly readonly: boolean;
  readonly sourcePath?: string;
};

export type MiraExtensionContribution =
  | CodeMirrorExtension
  | CodeMirrorExtension[];

export type MiraExtension = {
  name: string;
  codeMirror?: (
    context: MiraExtensionContext,
  ) => MiraExtensionContribution | null | undefined;
  codeLanguages?: LanguageDescription[];
  remarkPlugins?: Pluggable[];
  rehypePlugins?: Pluggable[];
  components?: MiraRendererComponents;
  commands?: MiraCommand[];
  slashCommands?: MiraSlashCommand[];
  blockActions?: MiraBlockAction[];
  toolbarItems?: MiraToolbarItem[];
  styles?: string[];
  onMount?: (context: MiraExtensionRuntimeContext) => void | (() => void);
};

export type ResolvedMiraExtensions = {
  codeMirror: CodeMirrorExtension[];
  codeLanguages: LanguageDescription[];
  remarkPlugins: Pluggable[];
  rehypePlugins: Pluggable[];
  components: MiraRendererComponents;
  commands: MiraCommand[];
  slashCommands: MiraSlashCommand[];
  blockActions: MiraBlockAction[];
  toolbarItems: MiraToolbarItem[];
  styles: string[];
  onMount: NonNullable<MiraExtension["onMount"]>[];
};

export function defineMiraExtension(extension: MiraExtension): MiraExtension {
  return extension;
}

export function emptyResolvedMiraExtensions(): ResolvedMiraExtensions {
  return {
    codeMirror: [],
    codeLanguages: [],
    remarkPlugins: [],
    rehypePlugins: [],
    components: {},
    commands: [],
    slashCommands: [],
    blockActions: [],
    toolbarItems: [],
    styles: [],
    onMount: [],
  };
}

export function resolveMiraExtensions(
  extensions: readonly MiraExtension[] = [],
  context: MiraExtensionContext,
): ResolvedMiraExtensions {
  const resolved = emptyResolvedMiraExtensions();

  for (const extension of extensions) {
    const codeMirror = extension.codeMirror?.(context);
    if (codeMirror) {
      resolved.codeMirror.push(...[codeMirror].flat());
    }

    resolved.codeLanguages.push(...(extension.codeLanguages ?? []));
    resolved.remarkPlugins.push(...(extension.remarkPlugins ?? []));
    resolved.rehypePlugins.push(...(extension.rehypePlugins ?? []));
    Object.assign(resolved.components, extension.components);
    resolved.commands.push(...(extension.commands ?? []));
    resolved.slashCommands.push(...(extension.slashCommands ?? []));
    resolved.blockActions.push(...(extension.blockActions ?? []));
    resolved.toolbarItems.push(...(extension.toolbarItems ?? []));
    resolved.styles.push(...(extension.styles ?? []));
    if (extension.onMount) {
      resolved.onMount.push(extension.onMount);
    }
  }

  return resolved;
}
