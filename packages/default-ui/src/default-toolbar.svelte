<script lang="ts">
  import BoldIcon from "@lucide/svelte/icons/bold";
  import BookOpenIcon from "@lucide/svelte/icons/book-open";
  import BracesIcon from "@lucide/svelte/icons/braces";
  import CheckIcon from "@lucide/svelte/icons/check";
  import CodeIcon from "@lucide/svelte/icons/code";
  import Columns2Icon from "@lucide/svelte/icons/columns-2";
  import FileCodeIcon from "@lucide/svelte/icons/file-code";
  import Heading1Icon from "@lucide/svelte/icons/heading-1";
  import ItalicIcon from "@lucide/svelte/icons/italic";
  import LinkIcon from "@lucide/svelte/icons/link";
  import ListIcon from "@lucide/svelte/icons/list";
  import ListChecksIcon from "@lucide/svelte/icons/list-checks";
  import PencilLineIcon from "@lucide/svelte/icons/pencil-line";
  import QuoteIcon from "@lucide/svelte/icons/quote";
  import Table2Icon from "@lucide/svelte/icons/table-2";
  import TableCellsSplitIcon from "@lucide/svelte/icons/table-cells-split";
  import WorkflowIcon from "@lucide/svelte/icons/workflow";
  import { Separator } from "@mira-mde/ui/separator";
  import * as DropdownMenu from "@mira-mde/ui/dropdown-menu";
  import * as Toolbar from "@mira-mde/ui/toolbar";
  import * as Tooltip from "@mira-mde/ui/tooltip";
  import type { Component } from "svelte";
  import type { MiraEditorSelection } from "@mira-mde/core";
  import type { MiraMode } from "@mira-mde/extensions";
  import {
    MiraFeature,
    resolveMiraDefaultFeatures,
    resolveMiraDefaultModes,
    resolveMiraDefaultToolbarActions,
    resolveMiraDefaultToolbarDefinitions,
    resolveMiraDefaultToolbarItems,
    type MiraDefaultToolbarAction,
    type MiraDefaultToolbarActionContext,
    type MiraDefaultToolbarDefinition,
    type MiraDefaultToolbarDropdownAction,
    type MiraDefaultToolbarItem,
    type MiraDefaultToolbarMenuItem,
  } from "./features";
  import type { MiraDefaultToolbarProps } from "./types";

  let {
    value = "",
    mode = $bindable("live-preview"),
    readonly = false,
    features = {},
    featureConfigs = {},
    toolbarActions = [],
    toolbars = [],
    modeOptions: modeOptionsProp,
    showModeSwitch = true,
    context,
    class: className = "",
    onModeChange,
    onInsertMarkdown,
  }: MiraDefaultToolbarProps = $props();

  const resolvedFeatures = $derived(resolveMiraDefaultFeatures(features));
  const modeOptions = $derived(
    modeOptionsProp ?? resolveMiraDefaultModes(features),
  );
  const toolbarItems = $derived(
    resolveMiraDefaultToolbarItems({ features, featureConfigs }),
  );
  const customToolbarActions = $derived(
    resolveMiraDefaultToolbarActions({ featureConfigs, toolbarActions }),
  );
  const customToolbars = $derived(
    resolveMiraDefaultToolbarDefinitions({ featureConfigs, toolbars }),
  );
  const startToolbars = $derived(
    customToolbars.filter((toolbar) => toolbar.align !== "end"),
  );
  const endToolbars = $derived(
    customToolbars.filter((toolbar) => toolbar.align === "end"),
  );

  const modeSwitchVisible = $derived(
    showModeSwitch &&
      resolvedFeatures[MiraFeature.ModeSwitch] &&
      modeOptions.length > 1,
  );
  const toolbarHasStartContent = $derived(
    startToolbars.length > 0 ||
      toolbarItems.length > 0 ||
      customToolbarActions.length > 0,
  );

  type ViewModeMenuItem = {
    mode: MiraMode;
    label: string;
    icon: Component<Record<string, unknown>>;
    checked: boolean;
  };

  let lastEditMode = $state<MiraMode>("live-preview");

  const modeLabels: Record<MiraMode, string> = {
    source: "Source mode",
    "live-preview": "Edit",
    preview: "Preview",
    split: "Split",
  };

  const modeIcons = {
    source: FileCodeIcon,
    "live-preview": PencilLineIcon,
    preview: BookOpenIcon,
    split: Columns2Icon,
  };

  const toolbarItemLabels: Record<MiraDefaultToolbarItem, string> = {
    heading: "Heading",
    bold: "Bold",
    italic: "Italic",
    quote: "Blockquote",
    bulletList: "Bullet list",
    taskList: "Task list",
    link: "Link",
    table: "Table",
    gridTable: "Grid table",
    code: "Code block",
    math: "Math",
    mermaid: "Mermaid diagram",
  };

  const toolbarItemIcons = {
    heading: Heading1Icon,
    bold: BoldIcon,
    italic: ItalicIcon,
    quote: QuoteIcon,
    bulletList: ListIcon,
    taskList: ListChecksIcon,
    link: LinkIcon,
    table: Table2Icon,
    gridTable: TableCellsSplitIcon,
    code: CodeIcon,
    math: BracesIcon,
    mermaid: WorkflowIcon,
  };

  const viewModeMenuItems = $derived(resolveViewModeMenuItems());
  const viewModeControlVisible = $derived(
    modeSwitchVisible &&
      (mode === "preview" || viewModeMenuItems.length > 0),
  );
  const splitModeVisible = $derived(
    modeSwitchVisible && modeOptions.includes("split"),
  );

  function fallbackContext(): MiraDefaultToolbarActionContext {
    return {
      value,
      mode,
      readonly,
      focus: () => undefined,
      getMarkdown: () => value,
      getMode: () => mode,
      getSelection: () => null,
      insertMarkdown(markdown) {
        onInsertMarkdown?.(markdown);
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

  function actionContext(): MiraDefaultToolbarActionContext {
    return context ?? fallbackContext();
  }

  function dynamicBoolean(
    value:
      | boolean
      | ((context: MiraDefaultToolbarActionContext) => boolean)
      | undefined,
  ): boolean {
    if (typeof value === "function") {
      return value(actionContext());
    }
    return value ?? false;
  }

  function isDropdownAction(
    action: MiraDefaultToolbarAction,
  ): action is MiraDefaultToolbarDropdownAction {
    return action.type === "dropdown";
  }

  function isToolbarActionDisabled(action: MiraDefaultToolbarAction): boolean {
    return dynamicBoolean(action.disabled);
  }

  function isToolbarActionPressed(action: MiraDefaultToolbarAction): boolean {
    return !isDropdownAction(action) && dynamicBoolean(action.pressed);
  }

  function runToolbarAction(action: MiraDefaultToolbarAction): void {
    if (isDropdownAction(action) || isToolbarActionDisabled(action)) {
      return;
    }
    action.run(actionContext());
  }

  function findToolbarAction(
    actionId: string,
  ): MiraDefaultToolbarAction | undefined {
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

  function menuItemKey(item: MiraDefaultToolbarMenuItem, index: number): string {
    const fallback = item.type === "separator" ? index : item.label;
    return `${item.type ?? "item"}-${item.id ?? fallback}`;
  }

  function isMenuItemDisabled(item: MiraDefaultToolbarMenuItem): boolean {
    return item.type !== "label" &&
      item.type !== "separator" &&
      dynamicBoolean(item.disabled);
  }

  function isMenuItemChecked(item: MiraDefaultToolbarMenuItem): boolean {
    return item.type !== "label" &&
      item.type !== "separator" &&
      dynamicBoolean(item.checked);
  }

  function menuItemIcon(
    item: MiraDefaultToolbarMenuItem,
  ): Component<Record<string, unknown>> | undefined {
    if (item.type === "label" || item.type === "separator") {
      return undefined;
    }
    return item.icon ?? (isMenuItemChecked(item) ? CheckIcon : undefined);
  }

  function runMenuItem(item: MiraDefaultToolbarMenuItem): void {
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

  function preferredEditMode(): MiraMode {
    if (lastEditMode !== "preview" && modeOptions.includes(lastEditMode)) {
      return lastEditMode;
    }
    if (modeOptions.includes("live-preview")) {
      return "live-preview";
    }
    if (modeOptions.includes("source")) {
      return "source";
    }
    return modeOptions.find((modeOption) => modeOption !== "preview") ?? "source";
  }

  function switchToEditMode(): void {
    applyMode(preferredEditMode());
  }

  function switchToSplitMode(): void {
    applyMode("split");
  }

  function resolveViewModeMenuItems(): ViewModeMenuItem[] {
    const itemModes: MiraMode[] = [];

    if (mode !== "live-preview" && modeOptions.includes("live-preview")) {
      itemModes.push("live-preview");
    }
    if (modeOptions.includes("source")) {
      itemModes.push("source");
    }
    if (modeOptions.includes("preview")) {
      itemModes.push("preview");
    }

    return itemModes.map((modeOption) => ({
      mode: modeOption,
      label: modeLabels[modeOption],
      icon: modeIcons[modeOption],
      checked: mode === modeOption,
    }));
  }

  function insertTemplate(item: MiraDefaultToolbarItem): void {
    const markdown = templateForToolbarItem(item);
    if (markdown) {
      actionContext().insertMarkdown(markdown);
    }
  }

  function templateForToolbarItem(item: MiraDefaultToolbarItem): string {
    switch (item) {
      case "heading":
        return "# Heading";
      case "bold":
        return "**strong**";
      case "italic":
        return "_emphasis_";
      case "quote":
        return "> Quote";
      case "bulletList":
        return "- List item";
      case "taskList":
        return "- [ ] Task";
      case "link":
        return "[label](https://example.com)";
      case "table":
        return "\n| Column | Value |\n| --- | --- |\n| Item | Detail |\n";
      case "gridTable":
        return "\n+--------+--------+\n| Column | Value  |\n+========+========+\n| Item   | Detail |\n+--------+--------+\n";
      case "code":
        return '\n```ts\nconsole.log("hello");\n```\n';
      case "math":
        return "$E = mc^2$";
      case "mermaid":
        return "\n```mermaid\nflowchart TD\n  A[Start] --> B[Done]\n```\n";
    }
  }

  $effect(() => {
    if (mode !== "preview") {
      lastEditMode = mode;
    }
  });
</script>

{#snippet renderAction(action: MiraDefaultToolbarAction)}
  {@const Icon = action.icon}
  {#if isDropdownAction(action)}
    <DropdownMenu.Root>
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <DropdownMenu.Trigger
              {...props}
              class="mira-toolbar__button"
              aria-label={action.label}
              disabled={isToolbarActionDisabled(action)}
            >
              <Icon class="mira-default-ui__icon" aria-hidden="true" />
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
                  class="mira-default-toolbar__menu-icon"
                  aria-hidden="true"
                />
              {/if}
              <span>{item.label}</span>
              {#if item.shortcut}
                <DropdownMenu.Shortcut>{item.shortcut}</DropdownMenu.Shortcut>
              {/if}
            </DropdownMenu.Item>
          {/if}
        {/each}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {:else}
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
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
            <Icon class="mira-default-ui__icon" aria-hidden="true" />
          </Toolbar.Button>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content>{action.tooltip ?? action.label}</Tooltip.Content>
    </Tooltip.Root>
  {/if}
{/snippet}

{#snippet renderToolbarSection(toolbar: MiraDefaultToolbarDefinition)}
  <div
    class="mira-default-ui__toolbar-section"
    role="group"
    aria-label={toolbar.label ?? toolbar.id}
  >
    {#each toolbar.items as action (action.id)}
      {@render renderAction(action)}
    {/each}
  </div>
{/snippet}

{#snippet renderViewModeControl()}
  {#if mode === "preview"}
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          {@const triggerProps = withTooltipClickHandler(props, () =>
            switchToEditMode(),
          )}
          <Toolbar.Button {...triggerProps} aria-label="Edit">
            <PencilLineIcon class="mira-default-ui__icon" aria-hidden="true" />
          </Toolbar.Button>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content>Edit</Tooltip.Content>
    </Tooltip.Root>
  {:else}
    <DropdownMenu.Root>
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <DropdownMenu.Trigger
              {...props}
              class="mira-toolbar__button"
              aria-label="View mode"
            >
              <BookOpenIcon class="mira-default-ui__icon" aria-hidden="true" />
            </DropdownMenu.Trigger>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content>View mode</Tooltip.Content>
      </Tooltip.Root>
      <DropdownMenu.Content align="end">
        {#each viewModeMenuItems as item (item.mode)}
          {@const ItemIcon = item.icon}
          <DropdownMenu.Item onclick={() => applyMode(item.mode)}>
            <ItemIcon
              class="mira-default-toolbar__menu-icon"
              aria-hidden="true"
            />
            <span>{item.label}</span>
            {#if item.checked}
              <CheckIcon
                class="mira-default-toolbar__menu-check"
                aria-hidden="true"
              />
            {/if}
          </DropdownMenu.Item>
        {/each}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {/if}
{/snippet}

{#snippet renderSplitModeButton()}
  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        {@const triggerProps = withTooltipClickHandler(props, () =>
          switchToSplitMode(),
        )}
        <Toolbar.Button
          {...triggerProps}
          aria-label="Split"
          aria-pressed={mode === "split" ? "true" : undefined}
        >
          <Columns2Icon class="mira-default-ui__icon" aria-hidden="true" />
        </Toolbar.Button>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content>Split</Tooltip.Content>
  </Tooltip.Root>
{/snippet}

<Tooltip.Provider delayDuration={350}>
  <div
    class="mira-default-toolbar__event-root"
    role="presentation"
    use:modeToolbarDelegate
  >
    <Toolbar.Root
      class={`mira-default-toolbar mira-default-ui__toolbar ${className}`.trim()}
      aria-label="Markdown editor toolbar"
    >
      {#each startToolbars as toolbar (toolbar.id)}
        {@render renderToolbarSection(toolbar)}
        <Separator orientation="vertical" class="mira-default-ui__separator" />
      {/each}

      {#if toolbarItems.length > 0}
        <div
          class="mira-default-ui__toolbar-section"
          role="group"
          aria-label="Insert"
        >
          {#each toolbarItems as item}
            {@const Icon = toolbarItemIcons[item]}
            <Tooltip.Root>
              <Tooltip.Trigger>
                {#snippet child({ props })}
                  {@const triggerProps = withTooltipClickHandler(props, () =>
                    insertTemplate(item),
                  )}
                  <Toolbar.Button
                    {...triggerProps}
                    aria-label={toolbarItemLabels[item]}
                    disabled={readonly}
                  >
                    <Icon class="mira-default-ui__icon" aria-hidden="true" />
                  </Toolbar.Button>
                {/snippet}
              </Tooltip.Trigger>
              <Tooltip.Content>{toolbarItemLabels[item]}</Tooltip.Content>
            </Tooltip.Root>
          {/each}
        </div>
      {/if}

      {#if customToolbarActions.length > 0}
        {#if toolbarItems.length > 0}
          <Separator
            orientation="vertical"
            class="mira-default-ui__separator"
          />
        {/if}
        <div
          class="mira-default-ui__toolbar-section"
          role="group"
          aria-label="Custom actions"
        >
          {#each customToolbarActions as action (action.id)}
            {@render renderAction(action)}
          {/each}
        </div>
      {/if}

      <div class="mira-default-toolbar__spacer"></div>

      {#each endToolbars as toolbar (toolbar.id)}
        {@render renderToolbarSection(toolbar)}
        <Separator orientation="vertical" class="mira-default-ui__separator" />
      {/each}

      {#if viewModeControlVisible || splitModeVisible}
        {#if toolbarHasStartContent || endToolbars.length > 0}
          <Separator
            orientation="vertical"
            class="mira-default-ui__separator"
          />
        {/if}
        <div
          class="mira-default-ui__toolbar-section"
          role="group"
          aria-label="View mode"
        >
          {#if viewModeControlVisible}
            {@render renderViewModeControl()}
          {/if}
          {#if splitModeVisible}
            {@render renderSplitModeButton()}
          {/if}
        </div>
      {/if}
    </Toolbar.Root>
  </div>
</Tooltip.Provider>
