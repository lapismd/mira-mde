<script lang="ts">
  import { MiraMde, type MiraMdeHandle } from "@mira-mde/svelte";
  import type { MiraEditorSelection } from "@mira-mde/core";
  import type { MiraMode } from "@mira-mde/extensions";
  import MiraDefaultToolbar from "./default-toolbar.svelte";
  import {
    createMiraDefaultExtensions,
    defaultMiraEditMode,
    MiraFeature,
    resolveMiraDefaultFeatures,
    resolveMiraDefaultEditMode,
    resolveMiraDefaultModes,
    type MiraDefaultToolbarActionContext,
  } from "./features";
  import type { MiraDefaultMdeProps } from "./types";

  let {
    value = $bindable(""),
    defaultEditMode = defaultMiraEditMode,
    mode = $bindable(defaultEditMode),
    readonly = false,
    placeholder = "Start writing Markdown...",
    lineWrapping = true,
    spellcheck = true,
    indentGuides = true,
    indentWithTabs = true,
    indentWidth = 4,
    theme = "obsidian",
    themeConfig,
    sourcePath,
    class: className = "",
    editorClass = "",
    features = {},
    featureConfigs = {},
    toolbarActions = [],
    toolbars = [],
    extensions = [],
    linkResolver,
    assetResolver,
    fileAdapter,
    imageConfig,
    frontmatterOpen = true,
    frontmatterConfig,
    headingIds = false,
    headingIdPrefix = "",
    htmlPolicy = "trusted",
    emoji = false,
    outline = false,
    onChange,
    onModeChange,
    onReadonlyChange,
    onIndentGuidesChange,
    onIndentWidthChange,
    onIndentWithTabsChange,
    onFrontmatterChange,
  }: MiraDefaultMdeProps = $props();

  let editor: MiraMdeHandle | null = $state(null);

  const resolvedFeatures = $derived(resolveMiraDefaultFeatures(features));
  const modeOptions = $derived(resolveMiraDefaultModes(features));
  const resolvedDefaultEditMode = $derived(
    resolveMiraDefaultEditMode(defaultEditMode, modeOptions),
  );
  const activeExtensions = $derived([
    ...createMiraDefaultExtensions({ features, featureConfigs }),
    ...extensions,
  ]);

  const toolbarVisible = $derived(resolvedFeatures[MiraFeature.Toolbar]);
  const toolbarContext = $derived(createToolbarActionContext());

  function handleChange(nextValue: string): void {
    value = nextValue;
    onChange?.(nextValue);
  }

  function applyMode(nextMode: MiraMode): void {
    if (!modeOptions.includes(nextMode)) {
      return;
    }
    mode = nextMode;
    onModeChange?.(nextMode);
  }

  function applyReadonly(nextReadonly: boolean): void {
    readonly = nextReadonly;
    onReadonlyChange?.(nextReadonly);
  }

  function applyIndentGuides(nextEnabled: boolean): void {
    indentGuides = nextEnabled;
    onIndentGuidesChange?.(nextEnabled);
  }

  function applyIndentWidth(nextWidth: number): void {
    indentWidth = nextWidth;
    onIndentWidthChange?.(nextWidth);
  }

  function applyIndentWithTabs(nextEnabled: boolean): void {
    indentWithTabs = nextEnabled;
    onIndentWithTabsChange?.(nextEnabled);
  }

  function createToolbarActionContext(): MiraDefaultToolbarActionContext {
    return {
      value,
      mode,
      readonly,
      focus,
      getIndentGuides: () => indentGuides,
      getIndentWidth: () => indentWidth,
      getIndentWithTabs: () => indentWithTabs,
      getMarkdown,
      getMode,
      getSelection,
      insertImage,
      insertMarkdown,
      setIndentGuides: applyIndentGuides,
      setIndentWidth: applyIndentWidth,
      setIndentWithTabs: applyIndentWithTabs,
      setMarkdown,
      setMode,
      setReadonly,
      setSelection,
    };
  }

  export function focus(): void {
    editor?.focus();
  }

  export function getMarkdown(): string {
    return editor?.getMarkdown() ?? value;
  }

  export function setMarkdown(markdown: string): void {
    value = markdown;
    editor?.setMarkdown(markdown);
  }

  export function getMode(): MiraMode {
    return mode;
  }

  export function setMode(nextMode: MiraMode): void {
    if (!modeOptions.includes(nextMode)) {
      return;
    }
    applyMode(nextMode);
    editor?.setMode(nextMode);
  }

  export function setReadonly(nextReadonly: boolean): void {
    applyReadonly(nextReadonly);
    editor?.setReadonly(nextReadonly);
  }

  export function getSelection(): MiraEditorSelection | null {
    return editor?.getSelection() ?? null;
  }

  export function setSelection(selection: MiraEditorSelection): void {
    editor?.setSelection(selection);
  }

  export function insertMarkdown(markdown: string): void {
    editor?.insertMarkdown(markdown);
  }

  export function insertImage(): void {
    editor?.insertImage();
  }

  $effect(() => {
    if (!modeOptions.includes(mode) && modeOptions[0]) {
      applyMode(modeOptions[0]);
    }
  });
</script>

<div
  class={`mira-default-ui ${className}`.trim()}
  data-mode={mode}
  data-readonly={readonly}
>
  {#if toolbarVisible}
    <MiraDefaultToolbar
      bind:mode
      {value}
      {readonly}
      {features}
      {featureConfigs}
      defaultEditMode={resolvedDefaultEditMode}
      {toolbarActions}
      {toolbars}
      context={toolbarContext}
      {indentGuides}
      {indentWidth}
      {indentWithTabs}
      onIndentGuidesChange={applyIndentGuides}
      onIndentWidthChange={applyIndentWidth}
      onIndentWithTabsChange={applyIndentWithTabs}
    />
  {/if}

  <div class="mira-default-ui__editor">
    <MiraMde
      {...{ frontmatterConfig } as any}
      bind:this={editor}
      bind:value
      bind:mode
      class={editorClass}
      {readonly}
      {placeholder}
      {lineWrapping}
      {spellcheck}
      {indentGuides}
      {indentWithTabs}
      {indentWidth}
      {theme}
      {themeConfig}
      {sourcePath}
      blockControls={resolvedFeatures[MiraFeature.BlockControls] &&
        featureConfigs[MiraFeature.BlockControls]?.enabled !== false}
      toolbar={false}
      extensions={activeExtensions}
      {linkResolver}
      {assetResolver}
      {fileAdapter}
      {imageConfig}
      frontmatterOpen={resolvedFeatures[MiraFeature.Frontmatter] &&
        frontmatterOpen}
      {headingIds}
      {headingIdPrefix}
      {htmlPolicy}
      {emoji}
      {outline}
      onChange={handleChange}
      {onFrontmatterChange}
    />
  </div>
</div>
