<script lang="ts">
  import { onMount, setContext, tick } from "svelte";
  import type { Extension } from "@codemirror/state";
  import {
    createMiraCodeMirrorExtensions,
    createMiraEditorController,
    openImageFilePicker,
    type MiraEditorController,
  } from "@lapismd/mira/core";
  import {
    executeMiraCommand,
    isMiraCommandEnabled,
    mountMiraExtensionStyles,
    resolveMiraExtensions,
    type MiraCommand,
    type MiraExtensionRuntimeContext,
    type MiraMode,
    type MiraTemplateSelection,
  } from "@lapismd/mira/extensions";
  import { MarkdownOutline, MarkdownPreview } from "@lapismd/mira/preview";
  import { Button } from "@lapismd/mira/ui/button";
  import { Separator } from "@lapismd/mira/ui/separator";
  import * as ToggleGroup from "@lapismd/mira/ui/toggle-group";
  import type { MiraProps } from "./types";
  import {
    miraAppearanceContextKey,
    miraColorModeAttribute,
    miraColorModeClassName,
    normalizeMiraTheme,
    type MiraAppearanceContext,
  } from "./internal/appearance-context";
  import {
    captureModeSwitchPosition,
    restoreEditorPosition,
    restorePreviewPosition,
    type MiraModeSwitchPosition,
  } from "./mode-position";

  let {
    value = $bindable(""),
    mode = $bindable("live-preview"),
    extensions = [],
    readonly = false,
    placeholder = "Start writing Markdown...",
    lineWrapping = true,
    spellcheck = true,
    blockControls = false,
    indentGuides = true,
    indentWithTabs = true,
    indentWidth = 4,
    theme,
    colorMode = "inherit",
    sourcePath,
    class: className = "",
    toolbar = true,
    linkResolver,
    assetResolver,
    fileAdapter,
    imageConfig,
    authoring,
    frontmatterOpen = true,
    frontmatterConfig,
    headingIds = false,
    headingIdPrefix = "",
    htmlPolicy = "trusted",
    emoji = false,
    outline = false,
    outlineVariant = "floating",
    onChange,
    onFrontmatterChange,
  }: MiraProps = $props();

  let editorHost: HTMLDivElement | null = $state(null);
  let previewPane: HTMLElement | null = $state(null);
  let controller: MiraEditorController | null = $state(null);
  let cleanupExtensionMounts: Array<() => void> = [];
  let previousMode = $state<MiraMode>(mode);
  let pendingModePosition = $state<MiraModeSwitchPosition | null>(null);

  setContext<MiraAppearanceContext>(miraAppearanceContextKey, {
    get theme() {
      return normalizeMiraTheme(theme);
    },
    get colorMode() {
      return colorMode;
    },
  });

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
      blockControls,
      indentGuides,
      indentWithTabs,
      indentWidth,
      sourcePath,
      JSON.stringify({
        authoring,
        max: imageConfig?.imageMaxSizeBytes,
        mime: imageConfig?.imageMimeTypes,
        syntax: imageConfig?.imageSyntax,
      }),
      extensions.map((extension) => extension.name).join(","),
      resolvedExtensions.slashCommands
        .map((command) =>
          [
            command.id,
            command.label,
            typeof command.insert === "string"
              ? command.insert
              : (command.insert?.markdown ?? ""),
            command.run ? "run" : "insert",
          ].join(":"),
        )
        .join(","),
      resolvedExtensions.listCallouts
        .map((callout) =>
          [
            callout.char,
            callout.color ?? "",
            callout.icon ?? "",
            callout.enabled === false ? "disabled" : "enabled",
          ].join(":"),
        )
        .join(","),
    ].join("|"),
  );
  const showEditor = $derived(mode !== "preview");
  const showPreview = $derived(mode === "preview" || mode === "split");
  const themeAttribute = $derived(normalizeMiraTheme(theme));
  const colorModeAttribute = $derived(miraColorModeAttribute(colorMode));
  const colorModeClass = $derived(miraColorModeClassName(colorMode));

  function buildCodeMirrorExtensions(): Extension[] {
    return createMiraCodeMirrorExtensions({
      mode,
      readonly,
      placeholder,
      lineWrapping,
      spellcheck,
      blockControls,
      indentGuides,
      indentWithTabs,
      indentWidth,
      extensions,
      sourcePath,
      linkResolver,
      assetResolver,
      fileAdapter,
      imageConfig,
      authoring,
      frontmatterOpen,
      frontmatterConfig,
      runtimeContext: (view) => createExtensionRuntimeContext(controller, view),
      onChange(replacement, from, to, nextValue) {
        if (controller) {
          controller.view.dispatch({
            changes: { from, to, insert: replacement },
          });
        } else {
          value = nextValue;
          onChange?.(nextValue);
        }
      },
      onFrontmatterChange,
    });
  }

  function runExtensionMounts(activeController: MiraEditorController): void {
    cleanupExtensionMounts.forEach((cleanup) => cleanup());
    cleanupExtensionMounts = [];

    for (const mountExtension of resolvedExtensions.onMount) {
      const cleanup = mountExtension(
        createExtensionRuntimeContext(activeController, activeController.view),
      );
      if (typeof cleanup === "function") {
        cleanupExtensionMounts.push(cleanup);
      }
    }
  }

  export function focus(): void {
    controller?.focus();
  }

  export function getMarkdown(): string {
    return controller?.getValue() ?? value;
  }

  export function setMarkdown(markdown: string): void {
    value = markdown;
    controller?.setValue(markdown);
  }

  export function getMode(): MiraMode {
    return mode;
  }

  export function getCommands(): readonly MiraCommand[] {
    return resolvedExtensions.commands;
  }

  export function isCommandEnabled(commandId: string): boolean {
    const command = findCommand(commandId);
    return Boolean(
      command &&
      isMiraCommandEnabled(command, createExtensionRuntimeContext(controller)),
    );
  }

  export function executeCommand(commandId: string): boolean {
    return executeMiraCommand(
      resolvedExtensions.commands,
      commandId,
      createExtensionRuntimeContext(controller),
    );
  }

  export function setMode(nextMode: MiraMode): void {
    mode = nextMode;
  }

  export function setReadonly(nextReadonly: boolean): void {
    readonly = nextReadonly;
  }

  export function getSelection(): ReturnType<
    MiraEditorController["getSelection"]
  > | null {
    return controller?.getSelection() ?? null;
  }

  export function setSelection(
    selection: ReturnType<MiraEditorController["getSelection"]>,
  ): void {
    controller?.setSelection(selection);
  }

  export function insertMarkdown(
    markdown: string,
    selection?: MiraTemplateSelection,
  ): void {
    controller?.replaceSelection(markdown, selection);
    controller?.focus();
  }

  export function insertImage(): void {
    if (controller) {
      openImageFilePicker(controller.view, imageConfig);
    }
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
    return mountMiraExtensionStyles(resolvedExtensions.styles);
  });

  $effect(() => {
    resolvedExtensions;
    extensionSignature;
    authoring;
    fileAdapter;
    if (controller) {
      controller.update({
        codeMirrorExtensions: buildCodeMirrorExtensions(),
      });
      runExtensionMounts(controller);
    }
  });

  $effect(() => {
    if (mode !== "split" || !controller || !previewPane) {
      return;
    }

    return syncSplitScroll(controller.view.scrollDOM, previewPane);
  });

  $effect.pre(() => {
    const nextMode = mode;
    if (nextMode === previousMode) {
      return;
    }
    const previewScroller =
      previewPane?.querySelector<HTMLElement>(".mira-markdown-preview") ??
      previewPane;
    pendingModePosition = captureModeSwitchPosition(
      previousMode,
      nextMode,
      controller?.view ?? null,
      previewScroller,
    );
    previousMode = nextMode;
  });

  $effect(() => {
    mode;
    controller;
    previewPane;
    const position = pendingModePosition;
    if (!position || !controller) {
      return;
    }

    let cancelled = false;
    void tick().then(() => {
      if (cancelled || pendingModePosition !== position || !controller) {
        return;
      }
      if (position.target === "editor") {
        restoreEditorPosition(controller.view, position);
      } else {
        const previewScroller =
          previewPane?.querySelector<HTMLElement>(".mira-markdown-preview") ??
          previewPane;
        if (previewScroller) {
          restorePreviewPosition(previewScroller, position);
        }
      }
      pendingModePosition = null;
    });

    return () => {
      cancelled = true;
    };
  });

  function syncSplitScroll(
    editorScroller: HTMLElement,
    previewPaneElement: HTMLElement,
  ): () => void {
    const previewScroller =
      previewPaneElement.querySelector<HTMLElement>(".mira-markdown-preview") ??
      previewPaneElement;
    let activeSource: HTMLElement | null = null;
    let releaseFrame = 0;

    const sync = (source: HTMLElement, target: HTMLElement) => {
      if (activeSource && activeSource !== source) {
        return;
      }

      const sourceMax = source.scrollHeight - source.clientHeight;
      const targetMax = target.scrollHeight - target.clientHeight;
      if (sourceMax <= 0 || targetMax <= 0) {
        return;
      }

      activeSource = source;
      target.scrollTop = (source.scrollTop / sourceMax) * targetMax;
      cancelAnimationFrame(releaseFrame);
      releaseFrame = requestAnimationFrame(() => {
        activeSource = null;
      });
    };

    const syncPreview = () => sync(editorScroller, previewScroller);
    const syncEditor = () => sync(previewScroller, editorScroller);

    editorScroller.addEventListener("scroll", syncPreview, { passive: true });
    previewScroller.addEventListener("scroll", syncEditor, { passive: true });

    return () => {
      cancelAnimationFrame(releaseFrame);
      editorScroller.removeEventListener("scroll", syncPreview);
      previewScroller.removeEventListener("scroll", syncEditor);
    };
  }

  function createExtensionRuntimeContext(
    activeController: MiraEditorController | null,
    view: unknown = activeController?.view,
  ): MiraExtensionRuntimeContext {
    return {
      view,
      mode,
      readonly,
      sourcePath,
      getValue: () => activeController?.getValue() ?? value,
      setValue(nextValue) {
        value = nextValue;
        activeController?.setValue(nextValue);
      },
      focus: () => activeController?.focus(),
      insertMarkdown,
      insertImage,
    };
  }

  function findCommand(commandId: string): MiraCommand | undefined {
    for (
      let index = resolvedExtensions.commands.length - 1;
      index >= 0;
      index -= 1
    ) {
      const command = resolvedExtensions.commands[index];
      if (command?.id === commandId) {
        return command;
      }
    }
    return undefined;
  }
</script>

<div
  class={`mira ${colorModeClass ?? ""} ${className}`.trim()}
  data-mira-theme={themeAttribute}
  data-mira-color-mode={colorModeAttribute}
  data-mode={mode}
  data-readonly={readonly}
>
  {#if toolbar}
    <div class="mira__toolbar" aria-label="Markdown editor toolbar">
      <ToggleGroup.Root
        bind:value={mode}
        aria-label="Editor mode"
        onValueChange={(next) => (mode = next as MiraMode)}
      >
        <ToggleGroup.Item value="source">Source</ToggleGroup.Item>
        <ToggleGroup.Item value="live-preview">Live</ToggleGroup.Item>
        <ToggleGroup.Item value="preview">Preview</ToggleGroup.Item>
        <ToggleGroup.Item value="split">Split</ToggleGroup.Item>
      </ToggleGroup.Root>

      <Separator orientation="vertical" class="mira__toolbar-separator" />

      <div class="mira__actions">
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
        <Button variant="ghost" size="sm" onclick={() => insertImage()}>
          Image
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

  <div class="mira__body">
    <section
      class={`mira__pane mira__pane--editor markdown-editor-surface ${
        mode === "source"
          ? "markdown-view__editor--source markdown-source-mode"
          : "markdown-view__editor--live-preview markdown-live-preview-mode"
      }`}
      data-visible={showEditor}
      aria-hidden={showEditor ? "false" : "true"}
    >
      <div class="mira__editor-scroll">
        <div bind:this={editorHost} class="mira__editor-host"></div>
      </div>
    </section>

    {#if showPreview}
      <section
        bind:this={previewPane}
        class={`mira__pane mira__pane--preview ${
          outline ? `mira__pane--outline-${outlineVariant}` : ""
        }`.trim()}
      >
        <MarkdownPreview
          {...{ frontmatterConfig } as any}
          class="markdown-reading-view"
          {value}
          {sourcePath}
          {extensions}
          {linkResolver}
          {assetResolver}
          {fileAdapter}
          {frontmatterOpen}
          headingIds={headingIds || outline}
          {headingIdPrefix}
          {htmlPolicy}
          {emoji}
          onChange={(replacement, from, to) => {
            const nextValue = `${value.slice(0, from)}${replacement}${value.slice(to)}`;
            value = nextValue;
            onChange?.(nextValue);
          }}
          {onFrontmatterChange}
        />
        {#if outline}
          <MarkdownOutline
            {value}
            {headingIdPrefix}
            variant={outlineVariant}
            root={previewPane}
          />
        {/if}
      </section>
    {/if}
  </div>
</div>
