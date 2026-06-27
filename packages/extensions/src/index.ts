import type { LanguageDescription } from "@codemirror/language";
import type { Extension as CodeMirrorExtension } from "@codemirror/state";
import type { Component } from "svelte";
import type { Pluggable } from "unified";

export type MiraRendererComponent =
  Component<any, any, any> | string | null | undefined;

export type MiraRendererComponents = Record<string, MiraRendererComponent>;

export type MiraTheme = "system" | "light" | "dark";

export type MiraMode = "source" | "live-preview" | "preview" | "split";

export type MiraCommand = {
  id: string;
  label: string;
  run: (context: MiraExtensionRuntimeContext) => void;
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

export type MiraExtensionRuntimeContext = {
  getValue: () => string;
  setValue: (value: string) => void;
  focus: () => void;
};

export type MiraExtensionContext = {
  readonly mode: MiraMode;
  readonly readonly: boolean;
  readonly sourcePath?: string;
};

export type MiraExtensionContribution =
  CodeMirrorExtension | CodeMirrorExtension[];

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
    resolved.toolbarItems.push(...(extension.toolbarItems ?? []));
    resolved.styles.push(...(extension.styles ?? []));
    if (extension.onMount) {
      resolved.onMount.push(extension.onMount);
    }
  }

  return resolved;
}
