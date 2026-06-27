<script lang="ts">
  import { onMount } from "svelte";
  import type { Extension } from "@codemirror/state";
  import { createBaseCodeMirrorExtensions } from "@mira-mde/codemirror";
  import { createMarkdownCodeMirrorExtensions } from "@mira-mde/codemirror-markdown";
  import { createRichEditorExtensions } from "@mira-mde/codemirror-rich";
  import { createTableExtensions } from "@mira-mde/codemirror-tables";
  import {
    createMiraEditorController,
    type MiraEditorController,
  } from "@mira-mde/core";
  import { resolveMiraExtensions } from "@mira-mde/extensions";
  import { MarkdownPreview } from "@mira-mde/preview";
  import { Button } from "@mira-mde/ui/button";
  import { Separator } from "@mira-mde/ui/separator";
  import * as ToggleGroup from "@mira-mde/ui/toggle-group";
  import type { MiraMdeProps } from "./types";

  let {
    value = $bindable(""),
    mode = $bindable("live-preview"),
    extensions = [],
    readonly = false,
    placeholder = "Start writing Markdown...",
    lineWrapping = true,
    spellcheck = true,
    theme = "system",
    sourcePath,
    class: className = "",
    toolbar = true,
    linkResolver,
    assetResolver,
    onChange,
  }: MiraMdeProps = $props();

  let editorHost: HTMLDivElement | null = $state(null);
  let controller: MiraEditorController | null = $state(null);
  let cleanupExtensionMounts: Array<() => void> = [];

  const resolvedExtensions = $derived(
    resolveMiraExtensions(extensions, {
      mode,
      readonly,
      sourcePath,
    }),
  );
  const extensionSignature = $derived(
    [
      mode,
      readonly,
      placeholder,
      lineWrapping,
      spellcheck,
      sourcePath,
      extensions.map((extension) => extension.name).join(","),
    ].join("|"),
  );
  const showEditor = $derived(mode !== "preview");
  const showPreview = $derived(mode === "preview" || mode === "split");
  const themeClass = $derived(
    theme === "dark"
      ? "mira-theme-dark"
      : theme === "light"
        ? "mira-theme-light"
        : "",
  );

  function buildCodeMirrorExtensions(): Extension[] {
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
      }),
      createMarkdownCodeMirrorExtensions({
        codeLanguages: resolved.codeLanguages,
      }),
      createTableExtensions(),
      mode === "live-preview" ? createRichEditorExtensions() : [],
      resolved.codeMirror,
    ].flat();
  }

  function runExtensionMounts(activeController: MiraEditorController): void {
    cleanupExtensionMounts.forEach((cleanup) => cleanup());
    cleanupExtensionMounts = [];

    for (const mountExtension of resolvedExtensions.onMount) {
      const cleanup = mountExtension({
        getValue: () => activeController.getValue(),
        setValue: (next) => activeController.setValue(next),
        focus: () => activeController.focus(),
      });
      if (typeof cleanup === "function") {
        cleanupExtensionMounts.push(cleanup);
      }
    }
  }

  function insertMarkdown(markdown: string): void {
    controller?.replaceSelection(markdown);
    controller?.focus();
  }

  onMount(() => {
    if (!editorHost) {
      return;
    }

    const activeController = createMiraEditorController({
      value,
      codeMirrorExtensions: buildCodeMirrorExtensions(),
      onChange(next) {
        value = next;
        onChange?.(next);
      },
    });

    activeController.mount(editorHost);
    controller = activeController;
    runExtensionMounts(activeController);

    return () => {
      cleanupExtensionMounts.forEach((cleanup) => cleanup());
      cleanupExtensionMounts = [];
      activeController.destroy();
      controller = null;
    };
  });

  $effect(() => {
    if (controller && value !== controller.getValue()) {
      controller.setValue(value);
    }
  });

  $effect(() => {
    extensionSignature;
    if (controller) {
      controller.update({
        codeMirrorExtensions: buildCodeMirrorExtensions(),
      });
      runExtensionMounts(controller);
    }
  });
</script>

<div
  class={`mira-mde ${themeClass} ${className}`.trim()}
  data-mode={mode}
  data-readonly={readonly}
>
  {#if toolbar}
    <div class="mira-mde__toolbar" aria-label="Markdown editor toolbar">
      <ToggleGroup.Root bind:value={mode} aria-label="Editor mode">
        <ToggleGroup.Item value="source">Source</ToggleGroup.Item>
        <ToggleGroup.Item value="live-preview">Live</ToggleGroup.Item>
        <ToggleGroup.Item value="preview">Preview</ToggleGroup.Item>
        <ToggleGroup.Item value="split">Split</ToggleGroup.Item>
      </ToggleGroup.Root>

      <Separator orientation="vertical" class="mira-mde__toolbar-separator" />

      <div class="mira-mde__actions">
        <Button
          variant="ghost"
          size="sm"
          onclick={() => insertMarkdown("**strong**")}
        >
          B
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onclick={() => insertMarkdown("_emphasis_")}
        >
          I
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onclick={() => insertMarkdown("[label](https://example.com)")}
        >
          Link
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onclick={() =>
            insertMarkdown("\n```mermaid\ngraph TD\n  A --> B\n```\n")}
        >
          Mermaid
        </Button>
      </div>
    </div>
  {/if}

  <div class="mira-mde__body">
    <section
      class="mira-mde__pane mira-mde__pane--editor"
      data-visible={showEditor}
      aria-hidden={showEditor ? "false" : "true"}
    >
      <div bind:this={editorHost} class="mira-mde__editor-host"></div>
    </section>

    {#if showPreview}
      <section class="mira-mde__pane mira-mde__pane--preview">
        <MarkdownPreview
          {value}
          {sourcePath}
          {extensions}
          {linkResolver}
          {assetResolver}
        />
      </section>
    {/if}
  </div>
</div>
