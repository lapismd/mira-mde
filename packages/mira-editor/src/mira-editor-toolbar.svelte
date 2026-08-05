<script lang="ts">
  import BoldIcon from "@lucide/svelte/icons/bold";
  import BookOpenIcon from "@lucide/svelte/icons/book-open";
  import BracesIcon from "@lucide/svelte/icons/braces";
  import CheckIcon from "@lucide/svelte/icons/check";
  import CodeIcon from "@lucide/svelte/icons/code";
  import CodeXmlIcon from "@lucide/svelte/icons/code-xml";
  import Columns2Icon from "@lucide/svelte/icons/columns-2";
  import EllipsisIcon from "@lucide/svelte/icons/ellipsis";
  import FileCodeIcon from "@lucide/svelte/icons/file-code";
  import Heading1Icon from "@lucide/svelte/icons/heading-1";
  import ImageIcon from "@lucide/svelte/icons/image";
  import InfoIcon from "@lucide/svelte/icons/info";
  import IndentIncreaseIcon from "@lucide/svelte/icons/indent-increase";
  import ItalicIcon from "@lucide/svelte/icons/italic";
  import LinkIcon from "@lucide/svelte/icons/link";
  import ListIcon from "@lucide/svelte/icons/list";
  import ListChecksIcon from "@lucide/svelte/icons/list-checks";
  import ListOrderedIcon from "@lucide/svelte/icons/list-ordered";
  import ListTreeIcon from "@lucide/svelte/icons/list-tree";
  import PencilLineIcon from "@lucide/svelte/icons/pencil-line";
  import QuoteIcon from "@lucide/svelte/icons/quote";
  import SpaceIcon from "@lucide/svelte/icons/space";
  import StrikethroughIcon from "@lucide/svelte/icons/strikethrough";
  import Table2Icon from "@lucide/svelte/icons/table-2";
  import TableCellsSplitIcon from "@lucide/svelte/icons/table-cells-split";
  import WorkflowIcon from "@lucide/svelte/icons/workflow";
  import { Separator } from "@lapismd/mira/ui/separator";
  import * as DropdownMenu from "@lapismd/mira/ui/dropdown-menu";
  import * as Toolbar from "@lapismd/mira/ui/toolbar";
  import * as Tooltip from "@lapismd/mira/ui/tooltip";
  import type { Component } from "svelte";
  import type { MiraEditorSelection } from "@lapismd/mira/core";
  import type { MiraMode } from "@lapismd/mira/extensions";
  import {
    MiraFeature,
    defaultMiraEditorEditMode,
    resolveMiraEditorFeatures,
    resolveMiraEditorEditMode,
    resolveMiraEditorModes,
    resolveMiraEditorToolbarActions,
    resolveMiraEditorToolbarDefinitions,
    resolveMiraEditorToolbarItems,
    type MiraEditorToolbarAction,
    type MiraEditorToolbarActionContext,
    type MiraEditorToolbarDefinition,
    type MiraEditorToolbarDropdownAction,
    type MiraEditorToolbarItem,
    type MiraEditorToolbarMenuItem,
  } from "./features";
  import {
    isMiraEditMode,
    markdownActionForMiraToolbarItem,
    miraEditorToolbarItemLabels,
    miraViewOptionsLabel,
    miraViewToggleLabel,
    resolveMiraModeAfterSplit,
    resolveMiraViewModeMenuItems,
    resolveMiraViewToggleMode,
    templateForMiraToolbarItem,
  } from "./toolbar-model";
  import type { MiraEditorToolbarProps } from "./types";
  import MiraEditorAboutDialog from "./mira-editor-about-dialog.svelte";

  let {
    value = "",
    mode = $bindable("live-preview"),
    defaultEditMode = defaultMiraEditorEditMode,
    readonly = false,
    features = {},
    featureConfigs = {},
    toolbarActions = [],
    toolbars = [],
    modeOptions: modeOptionsProp,
    showModeSwitch = true,
    indentGuides = true,
    indentWithTabs = true,
    indentWidth = 4,
    context,
    class: className = "",
    onModeChange,
    onInsertMarkdown,
    onInsertImage,
    onIndentGuidesChange,
    onIndentWidthChange,
    onIndentWithTabsChange,
  }: MiraEditorToolbarProps = $props();

  const resolvedFeatures = $derived(resolveMiraEditorFeatures(features));
  const modeOptions = $derived(
    modeOptionsProp ?? resolveMiraEditorModes(features),
  );
  const toolbarItems = $derived(
    resolveMiraEditorToolbarItems({ features, featureConfigs }),
  );
  const customToolbarActions = $derived(
    resolveMiraEditorToolbarActions({ featureConfigs, toolbarActions }),
  );
  const customToolbars = $derived(
    resolveMiraEditorToolbarDefinitions({ featureConfigs, toolbars }),
  );
  const startToolbars = $derived(
    customToolbars.filter((toolbar) => toolbar.align !== "end"),
  );
  const endToolbars = $derived(
    customToolbars.filter((toolbar) => toolbar.align === "end"),
  );
  const visibleStartToolbars = $derived(
    startToolbars.filter(toolbarHasRenderableActions),
  );
  const visibleEndToolbars = $derived(
    endToolbars.filter(toolbarHasRenderableActions),
  );
  const toolbarItemsVisible = $derived(toolbarItems.length > 0);
  const customToolbarActionsVisible = $derived(customToolbarActions.length > 0);

  const modeSwitchVisible = $derived(
    showModeSwitch &&
      resolvedFeatures[MiraFeature.ModeSwitch] &&
      modeOptions.length > 1,
  );
  const toolbarHasLeadingContent = $derived(
    visibleStartToolbars.length > 0 ||
      toolbarItemsVisible ||
      customToolbarActionsVisible,
  );

  let lastNonSplitMode = $state<MiraMode | null>(null);
  let aboutDialogOpen = $state(false);

  const modeIcons = {
    source: FileCodeIcon,
    "live-preview": PencilLineIcon,
    preview: BookOpenIcon,
    split: Columns2Icon,
  };

  const toolbarItemIcons = {
    heading: Heading1Icon,
    bold: BoldIcon,
    italic: ItalicIcon,
    strikethrough: StrikethroughIcon,
    inlineCode: CodeXmlIcon,
    quote: QuoteIcon,
    bulletList: ListIcon,
    numberedList: ListOrderedIcon,
    taskList: ListChecksIcon,
    link: LinkIcon,
    image: ImageIcon,
    table: Table2Icon,
    gridTable: TableCellsSplitIcon,
    code: CodeIcon,
    math: BracesIcon,
    mermaid: WorkflowIcon,
  };

  const resolvedDefaultEditMode = $derived(
    resolveMiraEditorEditMode(defaultEditMode, modeOptions),
  );
  const editModeOptions = $derived(
    modeOptions.filter((modeOption) => isMiraEditMode(modeOption)),
  );
  const viewModeMenuItems = $derived(
    resolveMiraViewModeMenuItems({
      mode,
      modeOptions,
      resolvedDefaultEditMode,
    }),
  );
  const viewModeToggleVisible = $derived(
    modeSwitchVisible &&
      modeOptions.includes("preview") &&
      editModeOptions.length > 0,
  );
  const splitModeVisible = $derived(
    modeSwitchVisible && modeOptions.includes("split"),
  );
  const editorSettingsMenuVisible = $derived(true);
  const viewModeOverflowVisible = $derived(
    (modeSwitchVisible && viewModeMenuItems.length > 0) ||
      editorSettingsMenuVisible,
  );
  const viewControlsVisible = $derived(
    viewModeToggleVisible || splitModeVisible || viewModeOverflowVisible,
  );
  const tabSizeOptions = [2, 4, 8];

  function toolbarHasRenderableActions(
    toolbar: MiraEditorToolbarDefinition,
  ): boolean {
    return toolbar.items.length > 0;
  }

  function fallbackContext(): MiraEditorToolbarActionContext {
    return {
      value,
      mode,
      readonly,
      focus: () => undefined,
      getIndentGuides: () => indentGuides,
      getIndentWidth: () => indentWidth,
      getIndentWithTabs: () => indentWithTabs,
      getMarkdown: () => value,
      getMode: () => mode,
      getSelection: () => null,
      insertMarkdown(markdown) {
        onInsertMarkdown?.(markdown);
      },
      insertImage() {
        onInsertImage?.();
      },
      setIndentGuides(nextEnabled) {
        indentGuides = nextEnabled;
        onIndentGuidesChange?.(nextEnabled);
      },
      setIndentWidth(nextWidth) {
        indentWidth = nextWidth;
        onIndentWidthChange?.(nextWidth);
      },
      setIndentWithTabs(nextEnabled) {
        indentWithTabs = nextEnabled;
        onIndentWithTabsChange?.(nextEnabled);
      },
      setMarkdown: () => undefined,
      setMode(nextMode) {
        mode = nextMode;
        onModeChange?.(nextMode);
      },
      setReadonly: () => undefined,
      setSelection: () => undefined,
    };
  }

  function actionContext(): MiraEditorToolbarActionContext {
    return context ?? fallbackContext();
  }

  function dynamicBoolean(
    value:
      | boolean
      | ((context: MiraEditorToolbarActionContext) => boolean)
      | undefined,
  ): boolean {
    if (typeof value === "function") {
      return value(actionContext());
    }
    return value ?? false;
  }

  function isDropdownAction(
    action: MiraEditorToolbarAction,
  ): action is MiraEditorToolbarDropdownAction {
    return action.type === "dropdown";
  }

  function isToolbarActionDisabled(action: MiraEditorToolbarAction): boolean {
    return dynamicBoolean(action.disabled);
  }

  function isToolbarActionPressed(action: MiraEditorToolbarAction): boolean {
    return !isDropdownAction(action) && dynamicBoolean(action.pressed);
  }

  function runToolbarAction(action: MiraEditorToolbarAction): void {
    if (isDropdownAction(action) || isToolbarActionDisabled(action)) {
      return;
    }
    action.run(actionContext());
  }

  function findToolbarAction(
    actionId: string,
  ): MiraEditorToolbarAction | undefined {
    return [
      ...customToolbarActions,
      ...customToolbars.flatMap((toolbar) => toolbar.items),
    ].find((action) => action.id === actionId);
  }

  function handleToolbarActionButtonClick(event: MouseEvent): void {
    const actionId = (event.currentTarget as HTMLElement | null)?.dataset
      .toolbarActionId;
    const action = actionId ? findToolbarAction(actionId) : undefined;
    if (action) {
      runToolbarAction(action);
    }
  }

  function modeToolbarDelegate(node: HTMLElement): { destroy: () => void } {
    node.dataset.miraToolbarDelegate = "ready";

    return {
      destroy() {
        delete node.dataset.miraToolbarDelegate;
      },
    };
  }

  function menuItemKey(item: MiraEditorToolbarMenuItem, index: number): string {
    const fallback = item.type === "separator" ? index : item.label;
    return `${item.type ?? "item"}-${item.id ?? fallback}`;
  }

  function isMenuItemDisabled(item: MiraEditorToolbarMenuItem): boolean {
    return (
      item.type !== "label" &&
      item.type !== "separator" &&
      dynamicBoolean(item.disabled)
    );
  }

  function isMenuItemChecked(item: MiraEditorToolbarMenuItem): boolean {
    return (
      item.type !== "label" &&
      item.type !== "separator" &&
      dynamicBoolean(item.checked)
    );
  }

  function menuItemIcon(
    item: MiraEditorToolbarMenuItem,
  ): Component<Record<string, unknown>> | undefined {
    if (item.type === "label" || item.type === "separator") {
      return undefined;
    }
    return item.icon;
  }

  function runMenuItem(item: MiraEditorToolbarMenuItem): void {
    if (
      item.type === "label" ||
      item.type === "separator" ||
      isMenuItemDisabled(item)
    ) {
      return;
    }
    item.run(actionContext());
  }

  function withTooltipClickHandler(
    props: Record<string, unknown>,
    handler: (event: MouseEvent) => void,
  ): Record<string, unknown> {
    const originalClick =
      typeof props.onclick === "function"
        ? (props.onclick as (event: MouseEvent) => void)
        : undefined;

    return {
      ...props,
      onclick(event: MouseEvent) {
        handler(event);
        originalClick?.(event);
      },
    };
  }

  function applyMode(nextMode: string): void {
    const typedMode = nextMode as MiraMode;
    if (!modeOptions.includes(typedMode)) {
      return;
    }
    mode = typedMode;
    context?.setMode(typedMode);
    onModeChange?.(typedMode);
  }

  function getIndentGuidesSetting(): boolean {
    return actionContext().getIndentGuides?.() ?? indentGuides;
  }

  function getIndentWidthSetting(): number {
    return actionContext().getIndentWidth?.() ?? indentWidth;
  }

  function getIndentWithTabsSetting(): boolean {
    return actionContext().getIndentWithTabs?.() ?? indentWithTabs;
  }

  function setIndentGuidesSetting(nextEnabled: boolean): void {
    const ctx = actionContext();
    if (ctx.setIndentGuides) {
      ctx.setIndentGuides(nextEnabled);
    } else {
      indentGuides = nextEnabled;
      onIndentGuidesChange?.(nextEnabled);
    }
  }

  function setIndentWidthSetting(nextWidth: number): void {
    const ctx = actionContext();
    if (ctx.setIndentWidth) {
      ctx.setIndentWidth(nextWidth);
    } else {
      indentWidth = nextWidth;
      onIndentWidthChange?.(nextWidth);
    }
  }

  function setIndentWithTabsSetting(nextEnabled: boolean): void {
    const ctx = actionContext();
    if (ctx.setIndentWithTabs) {
      ctx.setIndentWithTabs(nextEnabled);
    } else {
      indentWithTabs = nextEnabled;
      onIndentWithTabsChange?.(nextEnabled);
    }
  }

  function switchToSplitMode(): void {
    if (mode === "split") {
      applyMode(
        resolveMiraModeAfterSplit({
          lastNonSplitMode,
          modeOptions,
          resolvedDefaultEditMode,
        }),
      );
    } else {
      applyMode("split");
    }
  }

  function viewToggleIcon(): Component<Record<string, unknown>> {
    return mode === "preview" ? PencilLineIcon : BookOpenIcon;
  }

  function handleViewToggle(): void {
    applyMode(resolveMiraViewToggleMode(mode, resolvedDefaultEditMode));
  }

  $effect(() => {
    if (
      mode === "preview" &&
      !modeOptions.includes("preview") &&
      editModeOptions.length > 0
    ) {
      applyMode(resolvedDefaultEditMode);
    }
  });

  $effect(() => {
    if (mode !== "split" && modeOptions.includes(mode)) {
      lastNonSplitMode = mode;
    }
  });

  function insertTemplate(item: MiraEditorToolbarItem): void {
    const activeContext = actionContext();
    if (item === "image" && activeContext.insertImage) {
      activeContext.insertImage();
      return;
    }
    const action = markdownActionForMiraToolbarItem(item);
    if (action && activeContext.applyMarkdownAction) {
      activeContext.applyMarkdownAction(action);
      return;
    }
    const markdown = templateForMiraToolbarItem(item);
    if (markdown) {
      activeContext.insertMarkdown(markdown);
    }
  }
</script>

{#snippet renderAction(action: MiraEditorToolbarAction)}
  {@const Icon = action.icon}
  {#if isDropdownAction(action)}
    <DropdownMenu.Root>
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props }: { props: Record<string, unknown> })}
            <DropdownMenu.Trigger
              {...props}
              class="mira-toolbar__button"
              aria-label={action.label}
              disabled={isToolbarActionDisabled(action)}
            >
              <Icon class="mira-editor__icon" aria-hidden="true" />
            </DropdownMenu.Trigger>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content>{action.tooltip ?? action.label}</Tooltip.Content>
      </Tooltip.Root>
      <DropdownMenu.Content align="start">
        {#each action.items as item, index (menuItemKey(item, index))}
          {#if item.type === "separator"}
            <DropdownMenu.Separator />
          {:else if item.type === "label"}
            <DropdownMenu.Label>{item.label}</DropdownMenu.Label>
          {:else}
            {@const ItemIcon = menuItemIcon(item)}
            <DropdownMenu.Item
              disabled={isMenuItemDisabled(item)}
              onclick={() => runMenuItem(item)}
            >
              {#if ItemIcon}
                <ItemIcon
                  class="mira-editor-toolbar__menu-icon"
                  aria-hidden="true"
                />
              {:else}
                <span
                  class="mira-editor-toolbar__menu-icon-placeholder"
                  aria-hidden="true"
                ></span>
              {/if}
              <span>{item.label}</span>
              {#if item.shortcut}
                <DropdownMenu.Shortcut>{item.shortcut}</DropdownMenu.Shortcut>
              {/if}
              {#if isMenuItemChecked(item)}
                <CheckIcon
                  class="mira-editor-toolbar__menu-check"
                  aria-hidden="true"
                />
              {/if}
            </DropdownMenu.Item>
          {/if}
        {/each}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {:else}
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props }: { props: Record<string, unknown> })}
          {@const triggerProps = withTooltipClickHandler(
            props,
            handleToolbarActionButtonClick,
          )}
          <Toolbar.Button
            {...triggerProps}
            aria-label={action.label}
            aria-pressed={isToolbarActionPressed(action) ? "true" : undefined}
            data-toolbar-action-id={action.id}
            disabled={isToolbarActionDisabled(action)}
          >
            <Icon class="mira-editor__icon" aria-hidden="true" />
          </Toolbar.Button>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content>{action.tooltip ?? action.label}</Tooltip.Content>
    </Tooltip.Root>
  {/if}
{/snippet}

{#snippet renderToolbarSection(toolbar: MiraEditorToolbarDefinition)}
  <div
    class="mira-editor__toolbar-section"
    role="group"
    aria-label={toolbar.label ?? toolbar.id}
  >
    {#each toolbar.items as action (action.id)}
      {@render renderAction(action)}
    {/each}
  </div>
{/snippet}

{#snippet renderViewModeControl()}
  {@const ToggleIcon = viewToggleIcon()}
  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props }: { props: Record<string, unknown> })}
        {@const triggerProps = withTooltipClickHandler(props, () =>
          handleViewToggle(),
        )}
        <Toolbar.Button
          {...triggerProps}
          aria-label={miraViewToggleLabel(mode)}
        >
          <ToggleIcon class="mira-editor__icon" aria-hidden="true" />
        </Toolbar.Button>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content>{miraViewToggleLabel(mode)}</Tooltip.Content>
  </Tooltip.Root>
{/snippet}

{#snippet renderSplitModeButton()}
  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props }: { props: Record<string, unknown> })}
        {@const triggerProps = withTooltipClickHandler(props, () =>
          switchToSplitMode(),
        )}
        <Toolbar.Button
          {...triggerProps}
          aria-label="Split"
          aria-pressed={mode === "split" ? "true" : undefined}
        >
          <Columns2Icon class="mira-editor__icon" aria-hidden="true" />
        </Toolbar.Button>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content>Split</Tooltip.Content>
  </Tooltip.Root>
{/snippet}

{#snippet renderViewModeOverflow()}
  <DropdownMenu.Root>
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props }: { props: Record<string, unknown> })}
          <DropdownMenu.Trigger
            {...props}
            class="mira-toolbar__button"
            aria-label={miraViewOptionsLabel}
          >
            <EllipsisIcon class="mira-editor__icon" aria-hidden="true" />
          </DropdownMenu.Trigger>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content>{miraViewOptionsLabel}</Tooltip.Content>
    </Tooltip.Root>
    <DropdownMenu.Content align="end">
      {#if viewModeMenuItems.length > 0}
        {#each viewModeMenuItems as item (item.mode)}
          {@const ItemIcon = modeIcons[item.mode]}
          <DropdownMenu.Item onclick={() => applyMode(item.mode)}>
            <ItemIcon
              class="mira-editor-toolbar__menu-icon"
              aria-hidden="true"
            />
            <span>{item.label}</span>
            {#if item.checked}
              <CheckIcon
                class="mira-editor-toolbar__menu-check"
                aria-hidden="true"
              />
            {/if}
          </DropdownMenu.Item>
        {/each}
        <DropdownMenu.Separator />
      {/if}
      <DropdownMenu.Label>Editor</DropdownMenu.Label>
      <DropdownMenu.Item
        onclick={() => setIndentGuidesSetting(!getIndentGuidesSetting())}
      >
        <ListTreeIcon
          class="mira-editor-toolbar__menu-icon"
          aria-hidden="true"
        />
        <span>Indentation guides</span>
        {#if getIndentGuidesSetting()}
          <CheckIcon
            class="mira-editor-toolbar__menu-check"
            aria-hidden="true"
          />
        {/if}
      </DropdownMenu.Item>
      <DropdownMenu.Item
        onclick={() => setIndentWithTabsSetting(!getIndentWithTabsSetting())}
      >
        <IndentIncreaseIcon
          class="mira-editor-toolbar__menu-icon"
          aria-hidden="true"
        />
        <span>Use tabs for indentation</span>
        {#if getIndentWithTabsSetting()}
          <CheckIcon
            class="mira-editor-toolbar__menu-check"
            aria-hidden="true"
          />
        {/if}
      </DropdownMenu.Item>
      <DropdownMenu.Separator />
      <DropdownMenu.Label>Tab size</DropdownMenu.Label>
      {#each tabSizeOptions as size}
        <DropdownMenu.Item onclick={() => setIndentWidthSetting(size)}>
          <SpaceIcon
            class="mira-editor-toolbar__menu-icon"
            aria-hidden="true"
          />
          <span>{size} spaces</span>
          {#if getIndentWidthSetting() === size}
            <CheckIcon
              class="mira-editor-toolbar__menu-check"
              aria-hidden="true"
            />
          {/if}
        </DropdownMenu.Item>
      {/each}
      <DropdownMenu.Separator />
      <DropdownMenu.Item onclick={() => (aboutDialogOpen = true)}>
        <InfoIcon class="mira-editor-toolbar__menu-icon" aria-hidden="true" />
        <span>About Mira</span>
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/snippet}

<Tooltip.Provider delayDuration={350}>
  <div
    class="mira-editor-toolbar__event-root"
    role="presentation"
    use:modeToolbarDelegate
  >
    <Toolbar.Root
      class={`mira-editor-toolbar mira-editor__toolbar ${className}`.trim()}
      aria-label="Markdown editor toolbar"
    >
      {#each visibleStartToolbars as toolbar, index (toolbar.id)}
        {#if index > 0}
          <Separator orientation="vertical" class="mira-editor__separator" />
        {/if}
        {@render renderToolbarSection(toolbar)}
      {/each}

      {#if toolbarItemsVisible}
        {#if visibleStartToolbars.length > 0}
          <Separator orientation="vertical" class="mira-editor__separator" />
        {/if}
        <div
          class="mira-editor__toolbar-section"
          role="group"
          aria-label="Insert"
        >
          {#each toolbarItems as item}
            {@const Icon = toolbarItemIcons[item]}
            <Tooltip.Root>
              <Tooltip.Trigger>
                {#snippet child({ props }: { props: Record<string, unknown> })}
                  {@const triggerProps = withTooltipClickHandler(props, () =>
                    insertTemplate(item),
                  )}
                  <Toolbar.Button
                    {...triggerProps}
                    aria-label={miraEditorToolbarItemLabels[item]}
                    disabled={readonly || mode === "preview"}
                  >
                    <Icon class="mira-editor__icon" aria-hidden="true" />
                  </Toolbar.Button>
                {/snippet}
              </Tooltip.Trigger>
              <Tooltip.Content
                >{miraEditorToolbarItemLabels[item]}</Tooltip.Content
              >
            </Tooltip.Root>
          {/each}
        </div>
      {/if}

      {#if customToolbarActionsVisible}
        {#if visibleStartToolbars.length > 0 || toolbarItemsVisible}
          <Separator orientation="vertical" class="mira-editor__separator" />
        {/if}
        <div
          class="mira-editor__toolbar-section"
          role="group"
          aria-label="Custom actions"
        >
          {#each customToolbarActions as action (action.id)}
            {@render renderAction(action)}
          {/each}
        </div>
      {/if}

      <div class="mira-editor-toolbar__spacer"></div>

      {#each visibleEndToolbars as toolbar, index (toolbar.id)}
        {#if index > 0}
          <Separator orientation="vertical" class="mira-editor__separator" />
        {/if}
        {@render renderToolbarSection(toolbar)}
      {/each}

      {#if viewControlsVisible}
        {#if toolbarHasLeadingContent || visibleEndToolbars.length > 0}
          <Separator orientation="vertical" class="mira-editor__separator" />
        {/if}
        <div
          class="mira-editor__toolbar-section"
          role="group"
          aria-label="View controls"
        >
          {#if viewModeToggleVisible}
            {@render renderViewModeControl()}
          {/if}
          {#if splitModeVisible}
            {@render renderSplitModeButton()}
          {/if}
          {#if viewModeOverflowVisible}
            {@render renderViewModeOverflow()}
          {/if}
        </div>
      {/if}
    </Toolbar.Root>
  </div>
  <MiraEditorAboutDialog bind:open={aboutDialogOpen} />
</Tooltip.Provider>
