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

export type MiraToolbarItem = {
  id: string;
  label: string;
  command: string;
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
    resolved.toolbarItems.push(...(extension.toolbarItems ?? []));
    resolved.styles.push(...(extension.styles ?? []));
    if (extension.onMount) {
      resolved.onMount.push(extension.onMount);
    }
  }

  return resolved;
}
