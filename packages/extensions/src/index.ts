import type { LanguageDescription } from "@codemirror/language";
import type { Extension as CodeMirrorExtension } from "@codemirror/state";
import { keymap, type EditorView, type KeyBinding } from "@codemirror/view";
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

export type MiraImageSyntax = "reference" | "inline";

export type MiraImageUploadErrorHandler = (error: unknown, file: File) => void;

export type MiraImageUpload = (file: File) => Promise<string>;

export type MiraImageConfig = {
  imageUpload?: MiraImageUpload;
  imageMaxSizeBytes?: number;
  imageMimeTypes?: string[];
  imageSyntax?: MiraImageSyntax;
  onImageUploadError?: MiraImageUploadErrorHandler;
};

export type MiraMode = "source" | "live-preview" | "preview" | "split";

export type MiraCommand = {
  id: string;
  label: string;
  description?: string;
  group?: string;
  keywords?: string[];
  keybindings?: MiraCommandKeybinding[];
  enabled?: boolean | ((context: MiraExtensionRuntimeContext) => boolean);
  run: (context: MiraExtensionRuntimeContext) => void | Promise<void>;
};

export type MiraCommandKeybinding =
  | string
  | {
      key: string;
      mac?: string;
      win?: string;
      linux?: string;
      scope?: string;
      preventDefault?: boolean;
      stopPropagation?: boolean;
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
  tooltip?: string;
  icon?: MiraToolbarIconName;
  group?: string;
  align?: "start" | "end";
};

export type MiraToolbarIconName =
  | "check"
  | "code"
  | "command"
  | "image"
  | "link"
  | "play"
  | "rotate-ccw"
  | "save"
  | "sparkles"
  | "table"
  | "wand-sparkles";

export type MiraExtensionStyle =
  | string
  | {
      id?: string;
      href: string;
      media?: string;
      integrity?: string;
      crossOrigin?: "anonymous" | "use-credentials";
    }
  | {
      id?: string;
      cssText: string;
      media?: string;
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

export type MiraInternalLinkFormatTarget = {
  targetPath: string;
  sourcePath?: string;
  file?: MiraFileRef;
  files: readonly MiraFileRef[];
  embed?: boolean;
  heading?: string;
  alias?: string;
};

export type MiraInternalLinkFormatter = (
  target: MiraInternalLinkFormatTarget,
) => string;

export type MiraMarkdownCompletionConfig = {
  enabled?: boolean;
  files?: boolean;
  embeds?: boolean;
  headings?: boolean;
  displayText?: boolean;
  includeMissing?: boolean;
  fileFilter?: (file: MiraFileRef) => boolean;
  embedFilter?: (file: MiraFileRef) => boolean;
  formatLink?: MiraInternalLinkFormatter;
};

export type MiraSmartPasteConfig = {
  enabled?: boolean;
  html?: boolean;
  urlOverSelection?: boolean;
  convertHtml?: (html: string) => string | Promise<string>;
  onError?: (error: unknown) => void;
};

export type MiraMarkdownInputHandlerConfig = {
  enabled?: boolean;
  codeFence?: boolean;
  frontmatter?: boolean;
  ellipsis?: boolean;
};

export type MiraMarkdownAuthoringConfig = {
  completions?: boolean | MiraMarkdownCompletionConfig;
  smartPaste?: boolean | MiraSmartPasteConfig;
  inputHandlers?: boolean | MiraMarkdownInputHandlerConfig;
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
  mode?: MiraMode;
  readonly?: boolean;
  sourcePath?: string;
  getValue: () => string;
  setValue: (value: string) => void;
  focus: () => void;
  insertMarkdown: (markdown: string, selection?: MiraTemplateSelection) => void;
  insertImage?: () => void;
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
  styles?: MiraExtensionStyle[];
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
  styles: MiraExtensionStyle[];
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

export function isMiraCommandEnabled(
  command: MiraCommand,
  context: MiraExtensionRuntimeContext,
): boolean {
  if (typeof command.enabled === "function") {
    return command.enabled(context);
  }
  return command.enabled ?? true;
}

export function executeMiraCommand(
  commands: readonly MiraCommand[],
  commandId: string,
  context: MiraExtensionRuntimeContext,
): boolean {
  const command = findMiraCommand(commands, commandId);
  if (!command || !isMiraCommandEnabled(command, context)) {
    return false;
  }

  void command.run(context);
  return true;
}

export function createMiraCommandKeymap(
  commands: readonly MiraCommand[],
  contextForView: (view: EditorView) => MiraExtensionRuntimeContext,
): CodeMirrorExtension {
  const bindings: KeyBinding[] = [];

  for (const command of commands) {
    for (const binding of command.keybindings ?? []) {
      const definition =
        typeof binding === "string" ? { key: binding } : binding;
      bindings.push({
        ...definition,
        run(view) {
          return executeMiraCommand(commands, command.id, contextForView(view));
        },
      });
    }
  }

  return keymap.of(bindings);
}

type MountedStyle = {
  count: number;
  element: HTMLLinkElement | HTMLStyleElement;
};

const mountedStyleTargets = new WeakMap<
  ParentNode,
  Map<string, MountedStyle>
>();

export function mountMiraExtensionStyles(
  styles: readonly MiraExtensionStyle[],
  target?: ParentNode,
): () => void {
  const activeTarget =
    target ?? (typeof document === "undefined" ? undefined : document.head);
  if (!activeTarget || styles.length === 0) {
    return () => undefined;
  }

  let mounted = mountedStyleTargets.get(activeTarget);
  if (!mounted) {
    mounted = new Map();
    mountedStyleTargets.set(activeTarget, mounted);
  }

  const keys: string[] = [];
  for (const style of styles) {
    const normalized = normalizeMiraExtensionStyle(style);
    const key = normalized.key;
    const existing = mounted.get(key);
    if (existing) {
      existing.count += 1;
      keys.push(key);
      continue;
    }

    const element =
      normalized.kind === "href"
        ? createStylesheetLink(activeTarget, normalized)
        : createInlineStyle(activeTarget, normalized);
    activeTarget.appendChild(element);
    mounted.set(key, { count: 1, element });
    keys.push(key);
  }

  return () => {
    const current = mountedStyleTargets.get(activeTarget);
    if (!current) {
      return;
    }

    for (const key of keys) {
      const entry = current.get(key);
      if (!entry) {
        continue;
      }
      entry.count -= 1;
      if (entry.count === 0) {
        entry.element.remove();
        current.delete(key);
      }
    }

    if (current.size === 0) {
      mountedStyleTargets.delete(activeTarget);
    }
  };
}

function findMiraCommand(
  commands: readonly MiraCommand[],
  commandId: string,
): MiraCommand | undefined {
  for (let index = commands.length - 1; index >= 0; index -= 1) {
    const command = commands[index];
    if (command?.id === commandId) {
      return command;
    }
  }
  return undefined;
}

type NormalizedExtensionStyle =
  | {
      kind: "href";
      key: string;
      href: string;
      media?: string;
      integrity?: string;
      crossOrigin?: "anonymous" | "use-credentials";
    }
  | {
      kind: "cssText";
      key: string;
      cssText: string;
      media?: string;
    };

function normalizeMiraExtensionStyle(
  style: MiraExtensionStyle,
): NormalizedExtensionStyle {
  if (typeof style === "string") {
    return {
      kind: "href",
      key: `href:${style}`,
      href: style,
    };
  }
  if ("href" in style) {
    return {
      ...style,
      kind: "href",
      key: style.id ? `id:${style.id}` : `href:${style.href}`,
    };
  }
  return {
    ...style,
    kind: "cssText",
    key: style.id ? `id:${style.id}` : `cssText:${style.cssText}`,
  };
}

function ownerDocument(target: ParentNode): Document {
  if (target instanceof Document) {
    return target;
  }
  if (target.ownerDocument) {
    return target.ownerDocument;
  }
  throw new Error("Mira extension styles require a document-backed target");
}

function createStylesheetLink(
  target: ParentNode,
  style: Extract<NormalizedExtensionStyle, { kind: "href" }>,
): HTMLLinkElement {
  const element = ownerDocument(target).createElement("link");
  element.rel = "stylesheet";
  element.href = style.href;
  element.dataset.miraExtensionStyle = style.key;
  if (style.media) {
    element.media = style.media;
  }
  if (style.integrity) {
    element.integrity = style.integrity;
  }
  if (style.crossOrigin) {
    element.crossOrigin = style.crossOrigin;
  }
  return element;
}

function createInlineStyle(
  target: ParentNode,
  style: Extract<NormalizedExtensionStyle, { kind: "cssText" }>,
): HTMLStyleElement {
  const element = ownerDocument(target).createElement("style");
  element.textContent = style.cssText;
  element.dataset.miraExtensionStyle = style.key;
  if (style.media) {
    element.media = style.media;
  }
  return element;
}
