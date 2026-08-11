<script lang="ts">
  import { tick } from "svelte";
  import type { Extension } from "@codemirror/state";
  import { EditorView } from "@codemirror/view";
  import {
    createMiraCodeMirrorExtensions,
    fromOffset,
  } from "@lapismd/mira/core";
  import {
    mountMiraExtensionStyles,
    resolveMiraExtensions,
    type MiraAssetResolver,
    type MiraExtension,
    type MiraExtensionRuntimeContext,
    type MiraFileAdapter,
    type MiraImageConfig,
    type MiraLinkResolver,
    type MiraMarkdownAuthoringConfig,
  } from "@lapismd/mira/extensions";
  import MiraCodeEditor from "../../mira-code-editor.svelte";
  import type { MiraCodeEditorHandle } from "../../mira-code-editor";

  type Props = {
    value: string;
    extensions?: MiraExtension[];
    sourcePath?: string;
    linkResolver?: MiraLinkResolver;
    assetResolver?: MiraAssetResolver;
    fileAdapter?: MiraFileAdapter;
    imageConfig?: MiraImageConfig;
    authoring?: MiraMarkdownAuthoringConfig;
    frontmatterOpen?: boolean;
    frontmatterConfig?: unknown;
    selectionOffset?: number | null;
    focusOnMount?: boolean;
    onChange?: (value: string) => void;
    onFrontmatterChange?: (nextYaml: string, nextValue: string) => void;
    onEscape?: () => void;
  };

  let {
    value,
    extensions = [],
    sourcePath,
    linkResolver,
    assetResolver,
    fileAdapter,
    imageConfig,
    authoring,
    frontmatterOpen = false,
    frontmatterConfig,
    selectionOffset = null,
    focusOnMount = true,
    onChange,
    onFrontmatterChange,
    onEscape,
  }: Props = $props();

  let codeEditor: MiraCodeEditorHandle | null = $state(null);
  let cleanupExtensionMounts: Array<() => void> = [];
  let placedInitialSelection = false;

  const resolvedExtensions = $derived(
    resolveMiraExtensions(extensions, {
      mode: "live-preview",
      readonly: false,
      sourcePath,
    }),
  );
  const extensionSignature = $derived(
    [
      sourcePath,
      frontmatterOpen,
      JSON.stringify({ authoring, frontmatterConfig, imageConfig }),
      extensions.map((extension) => extension.name).join(","),
      resolvedExtensions.codeMirror.length,
      resolvedExtensions.commands.map((command) => command.id).join(","),
    ].join("|"),
  );

  function runtimeContext(
    activeEditor: MiraCodeEditorHandle | null,
    view: unknown = activeEditor?.getView(),
  ): MiraExtensionRuntimeContext {
    return {
      view,
      mode: "live-preview",
      readonly: false,
      sourcePath,
      getValue: () => activeEditor?.getValue() ?? value,
      setValue(nextValue) {
        activeEditor?.setValue(nextValue);
        onChange?.(nextValue);
      },
      focus: () => activeEditor?.focus(),
      insertMarkdown(markdown, selection) {
        activeEditor?.replaceSelection(markdown, selection);
        activeEditor?.focus();
      },
    };
  }

  function buildExtensions(): Extension[] {
    return createMiraCodeMirrorExtensions({
      includeBaseExtensions: false,
      mode: "live-preview",
      readonly: false,
      lineWrapping: true,
      spellcheck: true,
      blockControls: false,
      indentGuides: true,
      indentWithTabs: true,
      indentWidth: 4,
      extensions,
      sourcePath,
      linkResolver,
      assetResolver,
      fileAdapter,
      imageConfig,
      authoring,
      frontmatterOpen,
      frontmatterConfig,
      runtimeContext: (view) => runtimeContext(codeEditor, view),
      onChange(replacement, from, to) {
        codeEditor?.getView()?.dispatch({
          changes: { from, to, insert: replacement },
        });
      },
      onFrontmatterChange,
    }).concat(
      EditorView.domEventHandlers({
        keydown: (event) => {
          handleKeydown(event);
          return event.defaultPrevented;
        },
      }),
    );
  }

  const codeMirrorExtensions = $derived.by(() => {
    extensionSignature;
    linkResolver;
    assetResolver;
    fileAdapter;
    return buildExtensions();
  });

  function runExtensionMounts(activeEditor: MiraCodeEditorHandle): void {
    cleanupExtensionMounts.forEach((cleanup) => cleanup());
    cleanupExtensionMounts = [];

    const view = activeEditor.getView();
    if (!view) return;

    for (const mountExtension of resolvedExtensions.onMount) {
      const cleanup = mountExtension(runtimeContext(activeEditor, view));
      if (typeof cleanup === "function") {
        cleanupExtensionMounts.push(cleanup);
      }
    }
  }

  function placeInitialSelection(activeEditor: MiraCodeEditorHandle): void {
    const view = activeEditor.getView();
    if (!view) return;
    if (selectionOffset !== null) {
      const position = fromOffset(view.state.doc, selectionOffset);
      activeEditor.setSelection({ anchor: position, head: position });
    }
    if (focusOnMount) {
      activeEditor.focus();
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key !== "Escape") {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    onEscape?.();
  }

  $effect(() => mountMiraExtensionStyles(resolvedExtensions.styles));

  $effect(() => {
    resolvedExtensions;
    extensionSignature;
    codeMirrorExtensions;
    const activeEditor = codeEditor;
    if (activeEditor) runExtensionMounts(activeEditor);
    return () => {
      cleanupExtensionMounts.forEach((cleanup) => cleanup());
      cleanupExtensionMounts = [];
    };
  });

  $effect(() => {
    const activeEditor = codeEditor;
    if (!activeEditor || placedInitialSelection) return;
    placedInitialSelection = true;
    void tick().then(() => placeInitialSelection(activeEditor));
  });
</script>

<div
  class="mira-editable-markdown-preview__editor markdown-editor-surface markdown-live-preview-mode"
  data-editable-markdown-editor
  role="application"
  aria-label="Markdown editor"
>
  <MiraCodeEditor
    bind:this={codeEditor}
    {value}
    extensions={codeMirrorExtensions}
    lineWrapping={true}
    spellcheck={true}
    indentWithTabs={true}
    indentWidth={4}
    ariaLabel="Markdown editor"
    variant="document"
    surface="frameless"
    height="fill"
    minHeight="100%"
    class="mira-editable-markdown-preview__editor-host"
    onChange={(nextValue) => onChange?.(nextValue)}
  />
</div>
