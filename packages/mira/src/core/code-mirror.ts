import type { Extension } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import {
  createBaseCodeMirrorExtensions,
  createSlashCommandExtensions,
} from "../internal/codemirror/base/index";
import {
  createMarkdownAuthoringExtensions,
  createMarkdownCodeMirrorExtensions,
} from "../internal/codemirror/markdown/index";
import { createRichEditorExtensions } from "../internal/codemirror/rich/index";
import { createTableExtensions } from "../tables/index";
import {
  createMiraCommandKeymap,
  resolveMiraExtensions,
  type MiraAssetResolver,
  type MiraExtension,
  type MiraExtensionRuntimeContext,
  type MiraFileAdapter,
  type MiraImageConfig,
  type MiraLinkResolver,
  type MiraMarkdownAuthoringConfig,
  type MiraMode,
} from "../extensions/index";
import { createImageDropPasteExtension } from "./images";

export type MiraCodeMirrorExtensionsOptions = {
  mode: MiraMode;
  readonly?: boolean;
  placeholder?: string;
  lineWrapping?: boolean;
  spellcheck?: boolean;
  blockControls?: boolean;
  indentGuides?: boolean;
  indentWithTabs?: boolean;
  indentWidth?: number;
  extensions?: MiraExtension[];
  sourcePath?: string;
  linkResolver?: MiraLinkResolver;
  assetResolver?: MiraAssetResolver;
  fileAdapter?: MiraFileAdapter;
  imageConfig?: MiraImageConfig;
  authoring?: MiraMarkdownAuthoringConfig;
  frontmatterOpen?: boolean;
  frontmatterConfig?: unknown;
  runtimeContext: (view: EditorView) => MiraExtensionRuntimeContext;
  onChange?: (
    replacement: string,
    from: number,
    to: number,
    nextValue: string,
  ) => void;
  onFrontmatterChange?: (nextYaml: string, nextValue: string) => void;
};

export function createMiraCodeMirrorExtensions(
  options: MiraCodeMirrorExtensionsOptions,
): Extension[] {
  const {
    mode,
    readonly = false,
    placeholder,
    lineWrapping,
    spellcheck,
    blockControls,
    indentGuides,
    indentWithTabs,
    indentWidth,
    extensions = [],
    sourcePath,
    linkResolver,
    assetResolver,
    fileAdapter,
    imageConfig,
    authoring,
    frontmatterOpen,
    frontmatterConfig,
    runtimeContext,
    onChange,
    onFrontmatterChange,
  } = options;
  const resolved = resolveMiraExtensions(extensions, {
    mode,
    readonly,
    sourcePath,
  });

  return [
    createBaseCodeMirrorExtensions({
      readonly,
      placeholder,
      lineWrapping,
      spellcheck,
      indentWithTabs,
      indentWidth,
    }),
    createSlashCommandExtensions({ commands: resolved.slashCommands }),
    createMiraCommandKeymap(resolved.commands, runtimeContext),
    createMarkdownCodeMirrorExtensions({
      codeLanguages: resolved.codeLanguages,
      sourceMode: mode === "source",
    }),
    createTableExtensions(),
    createImageDropPasteExtension(imageConfig),
    createMarkdownAuthoringExtensions({
      config: authoring,
      fileAdapter,
      sourcePath,
    }),
    createRichEditorExtensions({
      blockActions: resolved.blockActions,
      blockControls: blockControls && mode !== "preview" && !readonly,
      livePreview: mode === "live-preview",
      indentGuides,
      extensions,
      sourcePath,
      linkResolver,
      assetResolver,
      fileAdapter,
      frontmatterOpen,
      frontmatterConfig,
      onChange,
      onFrontmatterChange,
    }),
    resolved.codeMirror,
  ].flat();
}
