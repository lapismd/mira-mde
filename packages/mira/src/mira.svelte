<script lang="ts">
  import { setContext, tick } from "svelte";
  import type { Extension } from "@codemirror/state";
  import {
    applyMiraMarkdownAction,
    createMiraCodeMirrorExtensions,
    openImageFilePicker,
    type MiraMarkdownActionId,
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
  import MiraCodeEditor from "./mira-code-editor.svelte";
  import type { MiraCodeEditorHandle } from "./mira-code-editor";
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

  let previewPane: HTMLElement | null = $state(null);
  let codeEditor: MiraCodeEditorHandle | null = $state(null);
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
      includeBaseExtensions: false,
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
      runtimeContext: (view) => createExtensionRuntimeContext(codeEditor, view),
      onChange(replacement, from, to, nextValue) {
        const view = codeEditor?.getView();
        if (view) {
          view.dispatch({
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

  const codeMirrorExtensions = $derived.by(() => {
    extensionSignature;
    authoring;
    fileAdapter;
    return buildCodeMirrorExtensions();
  });

  function runExtensionMounts(activeEditor: MiraCodeEditorHandle): void {
    cleanupExtensionMounts.forEach((cleanup) => cleanup());
    cleanupExtensionMounts = [];

    const view = activeEditor.getView();
    if (!view) return;

    for (const mountExtension of resolvedExtensions.onMount) {
      const cleanup = mountExtension(
        createExtensionRuntimeContext(activeEditor, view),
      );
      if (typeof cleanup === "function") {
        cleanupExtensionMounts.push(cleanup);
      }
    }
  }

  export function focus(): void {
    codeEditor?.focus();
  }

  export function getMarkdown(): string {
    return codeEditor?.getValue() ?? value;
  }

  export function setMarkdown(markdown: string): void {
    value = markdown;
    codeEditor?.setValue(markdown);
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
      isMiraCommandEnabled(command, createExtensionRuntimeContext(codeEditor)),
    );
  }

  export function executeCommand(commandId: string): boolean {
    return executeMiraCommand(
      resolvedExtensions.commands,
      commandId,
      createExtensionRuntimeContext(codeEditor),
    );
  }

  export function setMode(nextMode: MiraMode): void {
    mode = nextMode;
  }

  export function setReadonly(nextReadonly: boolean): void {
    readonly = nextReadonly;
  }

  export function getSelection(): ReturnType<
    MiraCodeEditorHandle["getSelection"]
  > {
    return codeEditor?.getSelection() ?? null;
  }

  export function setSelection(
    selection: NonNullable<ReturnType<MiraCodeEditorHandle["getSelection"]>>,
  ): void {
    codeEditor?.setSelection(selection);
  }

  export function insertMarkdown(
    markdown: string,
    selection?: MiraTemplateSelection,
  ): void {
    codeEditor?.replaceSelection(markdown, selection);
    codeEditor?.focus();
  }

  export function applyMarkdownAction(action: MiraMarkdownActionId): boolean {
    if (readonly || mode === "preview") {
      return false;
    }
    const view = codeEditor?.getView();
    return view ? applyMiraMarkdownAction(view, action) : false;
  }

  export function insertImage(): void {
    const view = codeEditor?.getView();
    if (view) {
      openImageFilePicker(view, imageConfig);
    }
  }

  $effect(() => {
    return mountMiraExtensionStyles(resolvedExtensions.styles);
  });

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
    const view = codeEditor?.getView();
    if (mode !== "split" || !view || !previewPane) {
      return;
    }

    return syncSplitScroll(view.scrollDOM, previewPane);
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
      codeEditor?.getView() ?? null,
      previewScroller,
    );
    previousMode = nextMode;
  });

  $effect(() => {
    mode;
    codeEditor;
    previewPane;
    const position = pendingModePosition;
    if (!position || !codeEditor) {
      return;
    }

    let cancelled = false;
    void tick().then(() => {
      const view = codeEditor?.getView();
      if (cancelled || pendingModePosition !== position || !view) {
        return;
      }
      if (position.target === "editor") {
        restoreEditorPosition(view, position);
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
    activeEditor: MiraCodeEditorHandle | null,
    view: unknown = activeEditor?.getView(),
  ): MiraExtensionRuntimeContext {
    return {
      view,
      mode,
      readonly,
      sourcePath,
      getValue: () => activeEditor?.getValue() ?? value,
      setValue(nextValue) {
        value = nextValue;
        activeEditor?.setValue(nextValue);
      },
      focus: () => activeEditor?.focus(),
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
          aria-label="Bold"
          disabled={readonly || mode === "preview"}
          onclick={() => applyMarkdownAction("bold")}
        >
          B
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Italic"
          disabled={readonly || mode === "preview"}
          onclick={() => applyMarkdownAction("italic")}
        >
          I
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Link"
          disabled={readonly || mode === "preview"}
          onclick={() => applyMarkdownAction("link")}
        >
          Link
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={readonly || mode === "preview"}
          onclick={() => insertImage()}
        >
          Image
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={readonly || mode === "preview"}
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
        <MiraCodeEditor
          bind:this={codeEditor}
          bind:value
          extensions={codeMirrorExtensions}
          {readonly}
          {placeholder}
          {lineWrapping}
          {spellcheck}
          {indentWithTabs}
          {indentWidth}
          ariaLabel="Markdown editor"
          variant="document"
          surface="frameless"
          height="fill"
          minHeight="100%"
          class="mira__editor-host"
          onChange={(next) => onChange?.(next)}
        />
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
