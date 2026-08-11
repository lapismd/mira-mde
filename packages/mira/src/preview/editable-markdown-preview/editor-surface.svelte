<script lang="ts">
  import { onMount, tick } from "svelte";
  import type { Extension } from "@codemirror/state";
  import {
    createMiraCodeMirrorExtensions,
    createMiraEditorController,
    fromOffset,
    type MiraEditorController,
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

  let host: HTMLDivElement | null = $state(null);
  let controller: MiraEditorController | null = $state(null);
  let cleanupExtensionMounts: Array<() => void> = [];

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
    activeController: MiraEditorController | null,
    view: unknown = activeController?.view,
  ): MiraExtensionRuntimeContext {
    return {
      view,
      mode: "live-preview",
      readonly: false,
      sourcePath,
      getValue: () => activeController?.getValue() ?? value,
      setValue(nextValue) {
        activeController?.setValue(nextValue);
        onChange?.(nextValue);
      },
      focus: () => activeController?.focus(),
      insertMarkdown(markdown, selection) {
        activeController?.replaceSelection(markdown, selection);
        activeController?.focus();
      },
    };
  }

  function buildExtensions(): Extension[] {
    return createMiraCodeMirrorExtensions({
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
      runtimeContext: (view) => runtimeContext(controller, view),
      onChange(replacement, from, to) {
        controller?.view.dispatch({
          changes: { from, to, insert: replacement },
        });
      },
      onFrontmatterChange,
    });
  }

  function runExtensionMounts(activeController: MiraEditorController): void {
    cleanupExtensionMounts.forEach((cleanup) => cleanup());
    cleanupExtensionMounts = [];

    for (const mountExtension of resolvedExtensions.onMount) {
      const cleanup = mountExtension(
        runtimeContext(activeController, activeController.view),
      );
      if (typeof cleanup === "function") {
        cleanupExtensionMounts.push(cleanup);
      }
    }
  }

  function placeInitialSelection(activeController: MiraEditorController): void {
    if (selectionOffset !== null) {
      const position = fromOffset(
        activeController.view.state.doc,
        selectionOffset,
      );
      activeController.setSelection({ anchor: position, head: position });
    }
    if (focusOnMount) {
      activeController.focus();
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

  onMount(() => {
    if (!host) {
      return;
    }

    const activeController = createMiraEditorController({
      value,
      codeMirrorExtensions: buildExtensions(),
      onChange(nextValue) {
        onChange?.(nextValue);
      },
    });
    activeController.mount(host);
    activeController.view.dom.addEventListener("keydown", handleKeydown);
    controller = activeController;
    runExtensionMounts(activeController);
    void tick().then(() => placeInitialSelection(activeController));

    return () => {
      cleanupExtensionMounts.forEach((cleanup) => cleanup());
      cleanupExtensionMounts = [];
      activeController.view.dom.removeEventListener("keydown", handleKeydown);
      activeController.destroy();
      controller = null;
    };
  });

  $effect(() => {
    if (controller && value !== controller.getValue()) {
      controller.setValue(value);
    }
  });

  $effect(() => mountMiraExtensionStyles(resolvedExtensions.styles));

  $effect(() => {
    extensionSignature;
    linkResolver;
    assetResolver;
    fileAdapter;
    if (controller) {
      controller.update({ codeMirrorExtensions: buildExtensions() });
      runExtensionMounts(controller);
    }
  });
</script>

<div
  class="mira-editable-markdown-preview__editor markdown-editor-surface markdown-live-preview-mode"
  data-editable-markdown-editor
  role="application"
  aria-label="Markdown editor"
>
  <div
    bind:this={host}
    class="mira-editable-markdown-preview__editor-host"
  ></div>
</div>
