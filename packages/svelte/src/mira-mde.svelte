<script lang="ts">
  import { onMount, tick } from "svelte";
  import type { Extension } from "@codemirror/state";
  import {
    createBaseCodeMirrorExtensions,
    createSlashCommandExtensions,
  } from "@mira-mde/codemirror";
  import {
    createMarkdownAuthoringExtensions,
    createMarkdownCodeMirrorExtensions,
  } from "@mira-mde/codemirror-markdown";
  import { createRichEditorExtensions } from "@mira-mde/codemirror-rich";
  import { createTableExtensions } from "@mira-mde/codemirror-tables";
  import {
    createImageDropPasteExtension,
    createMiraEditorController,
    openImageFilePicker,
    type MiraEditorController,
  } from "@mira-mde/core";
  import {
    createMiraCommandKeymap,
    executeMiraCommand,
    isMiraCommandEnabled,
    mountMiraExtensionStyles,
    resolveMiraExtensions,
    type MiraCommand,
    type MiraExtensionRuntimeContext,
    type MiraMode,
    type MiraTemplateSelection,
  } from "@mira-mde/extensions";
  import { MarkdownOutline, MarkdownPreview } from "@mira-mde/preview";
  import { Button } from "@mira-mde/ui/button";
  import { Separator } from "@mira-mde/ui/separator";
  import * as ToggleGroup from "@mira-mde/ui/toggle-group";
  import type { MiraMdeProps } from "./types";
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
    theme = "obsidian",
    themeConfig,
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
  }: MiraMdeProps = $props();

  let editorHost: HTMLDivElement | null = $state(null);
  let previewPane: HTMLElement | null = $state(null);
  let rootEl: HTMLDivElement | null = $state(null);
  let controller: MiraEditorController | null = $state(null);
  let cleanupExtensionMounts: Array<() => void> = [];
  let previousMode = $state<MiraMode>(mode);
  let pendingModePosition = $state<MiraModeSwitchPosition | null>(null);
  let inheritedTheme = $state<"obsidian" | "system" | "light" | "dark">(
    "system",
  );

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
  const themeClass = $derived(
    themeClassName(theme === "inherit" ? inheritedTheme : theme),
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
        indentWithTabs,
        indentWidth,
      }),
      createSlashCommandExtensions({
        commands: resolved.slashCommands,
      }),
      createMiraCommandKeymap(resolved.commands, (view) =>
        createExtensionRuntimeContext(controller, view),
      ),
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
      } as Parameters<typeof createRichEditorExtensions>[0] & {
        frontmatterConfig?: unknown;
        fileAdapter?: unknown;
      }),
      resolved.codeMirror,
    ].flat();
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
    if (theme !== "inherit") {
      return;
    }

    inheritedTheme = resolveInheritedTheme(rootEl, themeConfig);
    const observer = new MutationObserver(() => {
      inheritedTheme = resolveInheritedTheme(rootEl, themeConfig);
    });

    for (const element of themeObservationTargets(rootEl, themeConfig)) {
      observer.observe(element, {
        attributeFilter: [
          "class",
          ...(themeConfig?.attributeNames ?? [
            "data-theme",
            "data-color-scheme",
            "data-mode",
          ]),
        ],
        attributes: true,
      });
    }

    return () => observer.disconnect();
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

  function themeClassName(
    value: "obsidian" | "system" | "light" | "dark" | "inherit",
  ): string {
    if (value === "dark") {
      return "mira-theme-dark theme-dark dark";
    }
    if (value === "light") {
      return "mira-theme-light theme-light";
    }
    if (value === "system") {
      return "mira-theme-system";
    }
    return "mira-theme-obsidian theme-light";
  }

  function resolveInheritedTheme(
    element: HTMLElement | null,
    config: typeof themeConfig,
  ): "obsidian" | "system" | "light" | "dark" {
    const darkClasses = config?.darkClassNames ?? [
      "dark",
      "theme-dark",
      "mira-theme-dark",
    ];
    const lightClasses = config?.lightClassNames ?? [
      "light",
      "theme-light",
      "mira-theme-light",
    ];
    const darkValues = config?.darkDataThemeValues ?? ["dark", "theme-dark"];
    const lightValues = config?.lightDataThemeValues ?? [
      "light",
      "theme-light",
    ];
    const attributeNames = config?.attributeNames ?? [
      "data-theme",
      "data-color-scheme",
      "data-mode",
    ];

    for (const target of themeLookupTargets(element, config)) {
      for (const className of darkClasses) {
        if (target.classList.contains(className)) {
          return "dark";
        }
      }
      for (const className of lightClasses) {
        if (target.classList.contains(className)) {
          return "light";
        }
      }
      for (const attribute of attributeNames) {
        const value = target.getAttribute(attribute)?.toLowerCase();
        if (value && darkValues.includes(value)) {
          return "dark";
        }
        if (value && lightValues.includes(value)) {
          return "light";
        }
      }
    }

    return config?.fallback ?? "system";
  }

  function themeLookupTargets(
    element: HTMLElement | null,
    config: typeof themeConfig,
  ): HTMLElement[] {
    if (typeof document === "undefined") {
      return [];
    }

    const configuredRoot = config?.root;
    const rootElement = isDocument(configuredRoot)
      ? configuredRoot.documentElement
      : configuredRoot;
    const targets: HTMLElement[] = [];
    let current: HTMLElement | null =
      rootElement ?? element?.parentElement ?? document.documentElement;
    while (current) {
      targets.push(current);
      current = current.parentElement;
    }
    if (document.body && !targets.includes(document.body)) {
      targets.push(document.body);
    }
    if (!targets.includes(document.documentElement)) {
      targets.push(document.documentElement);
    }
    return targets;
  }

  function themeObservationTargets(
    element: HTMLElement | null,
    config: typeof themeConfig,
  ): HTMLElement[] {
    return themeLookupTargets(element, config);
  }

  function isDocument(value: unknown): value is Document {
    return typeof Document !== "undefined" && value instanceof Document;
  }

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
  bind:this={rootEl}
  class={`mira-mde ${themeClass} ${className}`.trim()}
  data-mode={mode}
  data-readonly={readonly}
>
  {#if toolbar}
    <div class="mira-mde__toolbar" aria-label="Markdown editor toolbar">
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

  <div class="mira-mde__body">
    <section
      class={`mira-mde__pane mira-mde__pane--editor markdown-editor-surface ${
        mode === "source"
          ? "markdown-view__editor--source markdown-source-mode"
          : "markdown-view__editor--live-preview markdown-live-preview-mode"
      }`}
      data-visible={showEditor}
      aria-hidden={showEditor ? "false" : "true"}
    >
      <div class="mira-mde__editor-scroll">
        <div bind:this={editorHost} class="mira-mde__editor-host"></div>
      </div>
    </section>

    {#if showPreview}
      <section
        bind:this={previewPane}
        class={`mira-mde__pane mira-mde__pane--preview ${
          outline ? `mira-mde__pane--outline-${outlineVariant}` : ""
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
