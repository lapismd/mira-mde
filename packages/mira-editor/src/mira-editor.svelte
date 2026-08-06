<script lang="ts">
  import CheckIcon from "@lucide/svelte/icons/check";
  import CodeIcon from "@lucide/svelte/icons/code";
  import CommandIcon from "@lucide/svelte/icons/command";
  import ImageIcon from "@lucide/svelte/icons/image";
  import LinkIcon from "@lucide/svelte/icons/link";
  import PlayIcon from "@lucide/svelte/icons/play";
  import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
  import SaveIcon from "@lucide/svelte/icons/save";
  import SparklesIcon from "@lucide/svelte/icons/sparkles";
  import TableIcon from "@lucide/svelte/icons/table-2";
  import WandSparklesIcon from "@lucide/svelte/icons/wand-sparkles";
  import { Mira, type MiraHandle } from "@lapismd/mira";
  import type {
    MiraEditorSelection,
    MiraMarkdownActionId,
  } from "@lapismd/mira/core";
  import {
    defineMiraExtension,
    resolveMiraExtensions,
    type MiraBlockActionContext,
    type MiraExtension,
    type MiraMode,
    type MiraTemplateSelection,
    type MiraToolbarIconName,
  } from "@lapismd/mira/extensions";
  import { mount, unmount, type Component } from "svelte";
  import {
    miraColorModeAttribute,
    miraColorModeClassName,
    normalizeMiraTheme,
    provideMiraAppearance,
  } from "@lapismd/mira/ui/appearance";
  import MiraEditorToolbar from "./mira-editor-toolbar.svelte";
  import {
    createMiraEditorExtensions,
    defaultMiraEditorEditMode,
    MiraFeature,
    resolveMiraEditorBlockControls,
    resolveMiraEditorFeatures,
    resolveMiraEditorEditMode,
    resolveMiraEditorModes,
    resolveMiraEditorToolbarActions,
    resolveMiraEditorToolbarDefinitions,
    type MiraEditorToolbarButtonAction,
    type MiraEditorToolbarActionContext,
    type MiraEditorToolbarDefinition,
  } from "./features";
  import type { MiraEditorProps } from "./types";

  let {
    value = $bindable(""),
    defaultEditMode = defaultMiraEditorEditMode,
    mode = $bindable(defaultEditMode),
    readonly = false,
    placeholder = "Start writing Markdown...",
    lineWrapping = true,
    spellcheck = true,
    indentGuides = true,
    indentWithTabs = true,
    indentWidth = 4,
    theme,
    colorMode = "inherit",
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
    onModeChange,
    onReadonlyChange,
    onIndentGuidesChange,
    onIndentWidthChange,
    onIndentWithTabsChange,
    onFrontmatterChange,
  }: MiraEditorProps = $props();

  provideMiraAppearance({
    get theme() {
      return normalizeMiraTheme(theme);
    },
    get colorMode() {
      return colorMode;
    },
  });

  const themeAttribute = $derived(normalizeMiraTheme(theme));
  const colorModeAttribute = $derived(miraColorModeAttribute(colorMode));
  const colorModeClass = $derived(miraColorModeClassName(colorMode));

  let editor: MiraHandle | null = $state(null);

  const resolvedFeatures = $derived(resolveMiraEditorFeatures(features));
  const modeOptions = $derived(resolveMiraEditorModes(features));
  const resolvedDefaultEditMode = $derived(
    resolveMiraEditorEditMode(defaultEditMode, modeOptions),
  );
  const frameworkBlockMenuActions = $derived.by(
    resolveFrameworkBlockMenuActions,
  );
  const frameworkBlockMenuExtension = $derived(
    createFrameworkBlockMenuExtension(frameworkBlockMenuActions),
  );
  const activeExtensions = $derived([
    ...createMiraEditorExtensions({ features, featureConfigs }),
    ...(frameworkBlockMenuExtension ? [frameworkBlockMenuExtension] : []),
    ...extensions,
  ]);
  const resolvedExtensionContributions = $derived(
    resolveMiraExtensions(activeExtensions, {
      mode,
      readonly,
      sourcePath,
    }),
  );
  const extensionToolbars = $derived.by(createExtensionToolbars);
  const activeToolbars = $derived([...extensionToolbars, ...toolbars]);

  const toolbarVisible = $derived(resolvedFeatures[MiraFeature.Toolbar]);
  const toolbarContext = $derived(createToolbarActionContext());
  const blockControls = $derived(
    resolveMiraEditorBlockControls({ featureConfigs, features }),
  );

  type FrameworkBlockMenuAction = {
    action: MiraEditorToolbarButtonAction;
    group: string;
  };

  function resolveFrameworkBlockMenuActions(): FrameworkBlockMenuAction[] {
    const actions = resolveMiraEditorToolbarActions({
      featureConfigs,
      toolbarActions,
    })
      .filter(isBlockMenuButton)
      .map((action) => ({ action, group: action.group ?? "Actions" }));
    const definitions = resolveMiraEditorToolbarDefinitions({
      featureConfigs,
      toolbars,
    }).flatMap((toolbar) =>
      toolbar.items.filter(isBlockMenuButton).map((action) => ({
        action,
        group: action.group ?? toolbar.label ?? "Actions",
      })),
    );
    return [...actions, ...definitions];
  }

  function isBlockMenuButton(
    action: import("./features").MiraEditorToolbarAction,
  ): action is MiraEditorToolbarButtonAction {
    return (
      action.type !== "dropdown" &&
      action.placements?.includes("block-menu") === true
    );
  }

  function createFrameworkBlockMenuExtension(
    actions: FrameworkBlockMenuAction[],
  ): MiraExtension | null {
    if (actions.length === 0) {
      return null;
    }
    return defineMiraExtension({
      name: "mira-editor-block-menu-actions",
      blockActions: actions.map(({ action, group }) => ({
        id: `mira-editor-${action.id}`,
        label: action.label,
        group,
        placements: ["block-menu"],
        shortcut: action.shortcut,
        disabled(context) {
          const disabled = action.disabled;
          const actionContext = createBlockToolbarActionContext(context);
          return typeof disabled === "function"
            ? disabled(actionContext)
            : (disabled ?? false);
        },
        renderIcon(target) {
          const component = mount(action.icon, {
            target,
            props: {
              class: "mira-editor__icon",
              "aria-hidden": "true",
            },
          });
          return () => {
            void unmount(component);
          };
        },
        run(context) {
          action.run(createBlockToolbarActionContext(context));
        },
      })),
    });
  }

  function createBlockToolbarActionContext(
    context: MiraBlockActionContext,
  ): MiraEditorToolbarActionContext {
    return {
      ...createToolbarActionContext(),
      block: context.block,
      blocks: context.blocks,
      handle: context.handle,
      affectedRange: context.affectedRange,
      replaceRange: context.replaceRange,
    };
  }

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

  function createToolbarActionContext(): MiraEditorToolbarActionContext {
    return {
      value,
      mode,
      readonly,
      applyMarkdownAction,
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

  export function executeCommand(commandId: string): boolean {
    return editor?.executeCommand(commandId) ?? false;
  }

  export function getCommands(): ReturnType<MiraHandle["getCommands"]> {
    return editor?.getCommands() ?? resolvedExtensionContributions.commands;
  }

  export function isCommandEnabled(commandId: string): boolean {
    return editor?.isCommandEnabled(commandId) ?? false;
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

  export function insertMarkdown(
    markdown: string,
    selection?: MiraTemplateSelection,
  ): void {
    editor?.insertMarkdown(markdown, selection);
  }

  export function applyMarkdownAction(action: MiraMarkdownActionId): boolean {
    if (readonly || mode === "preview") {
      return false;
    }
    return editor?.applyMarkdownAction(action) ?? false;
  }

  export function insertImage(): void {
    editor?.insertImage();
  }

  function createExtensionToolbars(): MiraEditorToolbarDefinition[] {
    const groups = new Map<string, MiraEditorToolbarDefinition>();

    for (const item of resolvedExtensionContributions.toolbarItems) {
      if (item.placements && !item.placements.includes("toolbar")) {
        continue;
      }
      const align = item.align ?? "start";
      const label = item.group ?? "Extensions";
      const key = `${align}:${label}`;
      let group = groups.get(key);
      if (!group) {
        group = {
          id: `extension-${slugify(label)}-${align}`,
          label,
          align,
          items: [],
        };
        groups.set(key, group);
      }

      group.items.push({
        id: `extension-${item.id}`,
        label: item.label,
        tooltip: item.tooltip,
        icon: extensionToolbarIcon(item.icon),
        disabled: () => (editor ? !isCommandEnabled(item.command) : false),
        run: () => {
          executeCommand(item.command);
        },
      });
    }

    return [...groups.values()];
  }

  function extensionToolbarIcon(
    icon: MiraToolbarIconName | undefined,
  ): Component<Record<string, unknown>> {
    return extensionToolbarIcons[icon ?? "command"] ?? CommandIcon;
  }

  function slugify(value: string): string {
    return (
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "extensions"
    );
  }

  const extensionToolbarIcons: Record<
    MiraToolbarIconName,
    Component<Record<string, unknown>>
  > = {
    check: CheckIcon,
    code: CodeIcon,
    command: CommandIcon,
    image: ImageIcon,
    link: LinkIcon,
    play: PlayIcon,
    "rotate-ccw": RotateCcwIcon,
    save: SaveIcon,
    sparkles: SparklesIcon,
    table: TableIcon,
    "wand-sparkles": WandSparklesIcon,
  };

  $effect(() => {
    if (!modeOptions.includes(mode) && modeOptions[0]) {
      applyMode(modeOptions[0]);
    }
  });
</script>

<div
  class={`mira-editor ${colorModeClass ?? ""} ${className}`.trim()}
  data-mira-theme={themeAttribute}
  data-mira-color-mode={colorModeAttribute}
  data-mode={mode}
  data-readonly={readonly}
>
  {#if toolbarVisible}
    <MiraEditorToolbar
      bind:mode
      {value}
      {readonly}
      {features}
      {featureConfigs}
      defaultEditMode={resolvedDefaultEditMode}
      {toolbarActions}
      toolbars={activeToolbars}
      context={toolbarContext}
      {indentGuides}
      {indentWidth}
      {indentWithTabs}
      onIndentGuidesChange={applyIndentGuides}
      onIndentWidthChange={applyIndentWidth}
      onIndentWithTabsChange={applyIndentWithTabs}
    />
  {/if}

  <div class="mira-editor__editor">
    <Mira
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
      {colorMode}
      {sourcePath}
      {blockControls}
      toolbar={false}
      extensions={activeExtensions}
      {linkResolver}
      {assetResolver}
      {fileAdapter}
      {imageConfig}
      {authoring}
      frontmatterOpen={resolvedFeatures[MiraFeature.Frontmatter] &&
        frontmatterOpen}
      {headingIds}
      {headingIdPrefix}
      {htmlPolicy}
      {emoji}
      {outline}
      {outlineVariant}
      onChange={handleChange}
      {onFrontmatterChange}
    />
  </div>
</div>
