<script lang="ts">
  import {
    formatFrontmatterValue,
    frontmatterPropertyLabel,
    frontmatterPropertyIcon,
    parseFrontmatterValue,
    parseFrontmatterPillWikilink,
    parseFrontmatterYaml,
    serializeFrontmatterRecord,
    toBuiltinFrontmatterKind,
    FrontmatterController,
    createFrontmatterPropertyManager,
    type FrontmatterProperty,
    type FrontmatterPropertyKind,
    type FrontmatterPropertyManager,
  } from "./frontmatter-utils";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import Icon from "./icon.svelte";
  import Link from "./link.svelte";
  import FrontmatterPropertyNameInput from "./frontmatter-property-name-input.svelte";
  import FrontmatterPropertyValueInput from "./frontmatter-property-value-input.svelte";
  import * as DropdownMenu from "../../ui/dropdown-menu/index.js";
  import type { MiraFileAdapter } from "@lapismd/mira/extensions";
  import {
    setMarkdownContext,
    tryUseMarkdownContext,
  } from "../renderer/context.svelte";

  type Props = {
    controller?: FrontmatterController;
    propertyManager?: FrontmatterPropertyManager;
    frontmatter?: string;
    value?: string;
    open?: boolean;
    showChrome?: boolean;
    fileAdapter?: MiraFileAdapter;
    ref?: HTMLElement | null;
    "data-offset"?: string | number;
    "data-offset-end"?: string | number;
  };

  let {
    controller: controllerProp,
    propertyManager: managerProp,
    frontmatter = "",
    value: valueProp = "",
    open: openProp,
    showChrome = true,
    fileAdapter,
    ref = $bindable(null),
    "data-offset": dataOffset,
    "data-offset-end": dataOffsetEnd,
  }: Props = $props();

  const markdown = tryUseMarkdownContext();
  const ownedMarkdown = markdown
    ? null
    : setMarkdownContext({
        markdown: "",
        sourcePath: undefined,
        extensions: [],
        remarkPlugins: [],
        rehypePlugins: [],
        remarkRehypeOptions: { allowDangerousHtml: true },
        components: {},
        fileAdapter: undefined,
        listCallouts: [],
        postProcess: () => {},
        frontmatterOpen: true,
        dialog: false,
      });
  const localController = new FrontmatterController();
  const fallbackManager = createFrontmatterPropertyManager({
    ...(markdown?.frontmatterConfig ?? {}),
    sourcePath: markdown?.sourcePath,
  });
  const controller = $derived(controllerProp ?? localController);
  const manager = $derived(
    managerProp ?? controller.propertyManager ?? fallbackManager,
  );

  let rawDraft = $state("");
  let frontmatterOpen = $state(markdown?.frontmatterOpen ?? true);
  let opened = $state<Record<string, boolean>>({});
  let listDrafts = $state<Record<string, string>>({});
  let typeMenuPath = $state<string | null>(null);
  let newPropertyPath = $state<string | null>(null);

  $effect(() => {
    frontmatterOpen = openProp ?? markdown?.frontmatterOpen ?? true;
  });

  $effect(() => {
    if (controllerProp) {
      if (managerProp && controllerProp.propertyManager !== managerProp) {
        controllerProp.update({ propertyManager: managerProp });
      }
      const nextDraft = controllerProp.getYaml();
      if (rawDraft !== nextDraft) {
        rawDraft = nextDraft;
      }
      return;
    }

    const yaml = frontmatter || valueProp;
    localController.update({
      propertyManager: managerProp ?? fallbackManager,
      sourcePath: markdown?.sourcePath,
      getMarkdown: markdown ? () => markdown.markdown : undefined,
      dataOffset: toNumber(dataOffset),
      dataOffsetEnd: toNumber(dataOffsetEnd),
      onChange: markdown?.onChange,
      onFrontmatterChange: markdown?.onFrontmatterChange,
    });
    localController.syncYaml(yaml, { commit: false });
    if (rawDraft !== yaml) {
      rawDraft = yaml;
    }
  });

  const parseError = $derived(controller.parseError);
  const rows = $derived.by(() => {
    controller.revision;
    if (controller.parseError) {
      return [] as FrontmatterProperty[];
    }
    return manager.properties(controller.getRecord());
  });
  const typeOptions = $derived.by(() => {
    controller.revision;
    return manager.typeOptions();
  });
  const sourcePath = $derived(
    controller.sourcePath ?? manager.sourcePath ?? markdown?.sourcePath,
  );
  const config = $derived(manager.config);

  $effect.pre(() => {
    if (!ownedMarkdown) {
      return;
    }
    ownedMarkdown.fileAdapter = fileAdapter;
    ownedMarkdown.sourcePath = sourcePath;
    ownedMarkdown.frontmatterConfig = config;
  });

  function updateProperty(
    property: FrontmatterProperty,
    nextValue: unknown,
  ): void {
    controller.updateProperty(property.path, nextValue);
  }

  function addProperty(): void {
    const nextName = controller.addProperty("text");
    if (nextName) {
      newPropertyPath = nextName;
    }
  }

  async function renameProperty(
    nextPropertyName: string,
    property: FrontmatterProperty,
  ): Promise<void> {
    if (!canRename(property)) {
      return;
    }

    const nextKey = nextPropertyName.trim();
    if (!nextKey || nextKey === property.key) {
      return;
    }

    const prevKey =
      property.path.length === 1 && typeof property.path[0] === "string"
        ? property.path[0]
        : null;

    if (newPropertyPath === property.pathString) {
      newPropertyPath = nextKey;
    }

    if (prevKey && manager.rename) {
      try {
        const result = await manager.rename(prevKey, nextKey);
        if (result.failedFiles.length) {
          return;
        }
        // Host rename already persisted vault files; refresh local view only.
        const nextRecord = {
          ...controller.getRecord(),
        };
        if (Object.prototype.hasOwnProperty.call(nextRecord, prevKey)) {
          nextRecord[nextKey] = nextRecord[prevKey];
          delete nextRecord[prevKey];
        }
        controller.syncRecord(nextRecord, { commit: false });
        return;
      } catch {
        return;
      }
    }

    controller.renameProperty(property.path, nextKey);
  }

  function changePropertyKind(
    property: FrontmatterProperty,
    kind: FrontmatterPropertyKind,
  ): void {
    controller.changePropertyKind(property, kind);
    typeMenuPath = null;
  }

  function canRename(property: FrontmatterProperty): boolean {
    return typeof property.path.at(-1) === "string";
  }

  function siblingPropertyNames(property: FrontmatterProperty): string[] {
    if (!property.parent) {
      return rows
        .filter((candidate) => candidate.id !== property.id)
        .map((candidate) => candidate.key);
    }

    const parent = findProperty(rows, property.parent);
    return (
      parent?.children
        .filter((candidate) => candidate.id !== property.id)
        .map((candidate) => candidate.key) ?? []
    );
  }

  function findProperty(
    properties: FrontmatterProperty[],
    path: string,
  ): FrontmatterProperty | null {
    for (const property of properties) {
      if (property.pathString === path) {
        return property;
      }
      const nested = findProperty(property.children, path);
      if (nested) {
        return nested;
      }
    }
    return null;
  }

  function clipboardApi() {
    return (
      config.clipboard ??
      (typeof navigator === "undefined" ? undefined : navigator.clipboard)
    );
  }

  async function copyProperty(
    property: FrontmatterProperty,
    cut = false,
  ): Promise<void> {
    const clipboard = clipboardApi();
    if (!clipboard) {
      handleActionError(
        new Error("Clipboard access is unavailable"),
        cut ? "cut" : "copy",
      );
      return;
    }

    try {
      await clipboard.writeText(
        serializeFrontmatterRecord({ [property.key]: property.value }),
      );
      if (cut) {
        removeProperty(property);
      }
    } catch (error) {
      handleActionError(error, cut ? "cut" : "copy");
    } finally {
      typeMenuPath = null;
    }
  }

  async function pasteProperties(property: FrontmatterProperty): Promise<void> {
    if (parseError) {
      return;
    }
    const clipboard = clipboardApi();
    if (!clipboard) {
      handleActionError(new Error("Clipboard access is unavailable"), "paste");
      return;
    }

    try {
      const pasted = parseFrontmatterYaml(await clipboard.readText());
      if (!pasted.ok) {
        throw new Error(pasted.error);
      }
      controller.mergeProperties(property.path.slice(0, -1), pasted.value);
    } catch (error) {
      handleActionError(error, "paste");
    } finally {
      typeMenuPath = null;
    }
  }

  function removeProperty(property: FrontmatterProperty): void {
    try {
      controller.removeProperty(property.path);
    } catch (error) {
      handleActionError(error, "remove");
    } finally {
      typeMenuPath = null;
    }
  }

  function handleActionError(
    error: unknown,
    action: "copy" | "cut" | "paste" | "remove",
  ): void {
    config.onActionError?.(error, action);
  }

  function updateTextProperty(
    event: Event,
    property: FrontmatterProperty,
  ): void {
    const target = event.currentTarget as
      | HTMLInputElement
      | HTMLTextAreaElement;
    updateProperty(
      property,
      parseFrontmatterValue(target.value, property.kind),
    );
  }

  function updateEditableTextProperty(
    event: Event,
    property: FrontmatterProperty,
  ): void {
    const target = event.currentTarget as HTMLElement;
    updateProperty(property, target.textContent ?? "");
  }

  function handleEditableTextKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      (event.currentTarget as HTMLElement).blur();
    }
  }

  function updateBooleanProperty(
    event: Event,
    property: FrontmatterProperty,
  ): void {
    const target = event.currentTarget as HTMLInputElement;
    updateProperty(property, target.checked);
  }

  function listValues(property: FrontmatterProperty): string[] {
    if (Array.isArray(property.value)) {
      return property.value.map((item) => String(item));
    }
    if (typeof property.value === "string") {
      return property.value
        .split(/[,;]+/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  }

  function normalizeListValue(value: string): string {
    return value.trim().replace(/[,;]+$/u, "");
  }

  function displayListValue(
    property: FrontmatterProperty,
    value: string,
  ): string {
    if (property.kind === "tags") {
      return value.replace(/^#/, "");
    }
    return value;
  }

  function setListDraft(path: string, value: string): void {
    listDrafts = {
      ...listDrafts,
      [path]: value,
    };
  }

  function clearListDraft(path: string): void {
    const next = { ...listDrafts };
    delete next[path];
    listDrafts = next;
  }

  function commitListValues(
    property: FrontmatterProperty,
    raw = listDrafts[property.pathString] ?? "",
  ): void {
    const nextValues = raw
      .split(/[,;]+/)
      .map(normalizeListValue)
      .filter(Boolean);
    if (!nextValues.length) {
      return;
    }

    const current = listValues(property);
    const next = [...current];
    for (const value of nextValues) {
      if (!next.includes(value)) {
        next.push(value);
      }
    }
    clearListDraft(property.pathString);
    updateProperty(property, next);
  }

  function removeListValue(property: FrontmatterProperty, index: number): void {
    updateProperty(
      property,
      listValues(property).filter((_, itemIndex) => itemIndex !== index),
    );
  }

  function toggleOpen(path: string): void {
    opened = {
      ...opened,
      [path]: !isOpen(path),
    };
  }

  function isOpen(path: string): boolean {
    return opened[path] === true;
  }

  function toNumber(value: string | number | undefined): number | null {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === "string") {
      const numberValue = Number(value);
      return Number.isFinite(numberValue) ? numberValue : null;
    }
    return null;
  }

  function inputType(kind: FrontmatterPropertyKind): string {
    const builtinKind = toBuiltinFrontmatterKind(kind);
    if (builtinKind === "number") {
      return "number";
    }
    if (builtinKind === "date") {
      return "date";
    }
    if (builtinKind === "datetime") {
      return "datetime-local";
    }
    return "text";
  }

  function valueClass(kind: FrontmatterPropertyKind): string {
    const builtinKind = toBuiltinFrontmatterKind(kind);
    return `mod-${builtinKind === "checkbox" ? "boolean" : builtinKind}`;
  }

  function hasCustomWidget(property: FrontmatterProperty): boolean {
    return Boolean(manager.resolveWidget(property.kind)?.render);
  }

  function renderCustomWidget(
    element: HTMLElement,
    property: FrontmatterProperty,
  ) {
    let cleanup: (() => void) | void;

    function mountWidget(nextProperty: FrontmatterProperty) {
      cleanup?.();
      cleanup = manager.resolveWidget(nextProperty.kind)?.render?.(element, {
        property: nextProperty,
        sourcePath,
        setValue(nextValue) {
          updateProperty(nextProperty, nextValue);
        },
      });
    }

    mountWidget(property);

    return {
      update(nextProperty: FrontmatterProperty) {
        mountWidget(nextProperty);
      },
      destroy() {
        cleanup?.();
      },
    };
  }

  function emitRawYaml(nextYaml: string): void {
    controller.commitYaml(nextYaml);
  }
</script>

<div
  bind:this={ref}
  class="md-frontmatter"
  class:md-frontmatter--panel={!showChrome}
  data-editable-markdown-ignore-click
  data-testid="mira-frontmatter-editor"
>
  <div
    class="md-frontmatter__collapsible"
    data-state={frontmatterOpen || !showChrome ? "open" : "closed"}
  >
    {#if showChrome}
      <button
        type="button"
        class="md-frontmatter__trigger"
        aria-label={frontmatterOpen
          ? "Collapse properties"
          : "Expand properties"}
        aria-expanded={frontmatterOpen}
        onmousedown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onclick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          frontmatterOpen = !frontmatterOpen;
        }}
      >
        <ChevronRight class="md-frontmatter__chevron" aria-hidden="true" />
        <span class="md-frontmatter__title">Properties</span>
      </button>
    {/if}

    {#if frontmatterOpen || !showChrome}
      <div class="md-frontmatter__content">
        <div class="mira-frontmatter metadata-container @container p-1 text-sm">
          {#if !parseError}
            <div class="metadata-properties" data-empty={rows.length === 0}>
              {#if rows.length === 0}
                <p class="metadata-empty mira-frontmatter__empty">
                  No properties
                </p>
              {/if}

              {#each rows as row (row.id)}
                {@render Tree({ property: row })}
              {/each}
              <button
                type="button"
                class="metadata-add-property"
                onclick={addProperty}
              >
                <Icon name="plus" class="size-4" />
                <span>Add property</span>
              </button>
            </div>
          {:else}
            <div class="mira-frontmatter__raw">
              <p class="mira-frontmatter__error">{parseError}</p>
              <textarea
                class="metadata-input metadata-input-longtext mira-frontmatter__textarea mira-frontmatter__textarea--raw"
                bind:value={rawDraft}
                rows="6"
                onblur={() => emitRawYaml(rawDraft)}
              ></textarea>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

{#snippet Tree({ property }: { property: FrontmatterProperty })}
  {#if property.children.length}
    <div
      class="metadata-property metadata-property--parent focus-within:ring-border relative flex border-b focus-within:rounded-sm focus-within:border focus-within:ring-2"
      data-property={property.pathString}
      data-state={isOpen(property.pathString) ? "open" : "closed"}
      style={`--mira-property-depth: ${property.depth}`}
    >
      <div
        class="metadata-property-key focus-within:bg-secondary text-muted-foreground flex w-full shrink-0 flex-row self-stretch"
      >
        <span class="metadata-property-icon flex items-center py-1 pl-1">
          <button
            type="button"
            class="metadata-property-collapse-indicator"
            aria-label={`${isOpen(property.pathString) ? "Collapse" : "Expand"} ${property.key}`}
            aria-expanded={isOpen(property.pathString)}
            onclick={() => toggleOpen(property.pathString)}
          >
            <ChevronRight
              class="metadata-property-collapse-indicator__icon"
              aria-hidden="true"
            />
          </button>
          {@render TypeMenu({ property, icon: "list-tree" })}
        </span>
        <FrontmatterPropertyNameInput
          value={property.key}
          {config}
          excludedNames={siblingPropertyNames(property)}
          title={property.pathString}
          readonly={!canRename(property)}
          onCommit={(value) => void renameProperty(value, property)}
        />
      </div>
    </div>

    {#if isOpen(property.pathString)}
      <div
        class="metadata-property-children"
        style={`--mira-property-depth: ${property.depth + 1}`}
      >
        {#each property.children as child (child.id)}
          {@render Tree({ property: child })}
        {/each}
      </div>
    {/if}
  {:else}
    <div
      class="metadata-property focus-within:ring-border relative flex border-b focus-within:rounded-sm focus-within:border focus-within:ring-2"
      data-property={property.pathString}
      data-property-type={property.type}
      data-valid={property.valid}
      style={`--mira-property-depth: ${property.depth}`}
    >
      <div
        class="metadata-property-key focus-within:bg-secondary text-muted-foreground flex shrink-0 self-stretch"
      >
        <span class="metadata-property-icon flex items-center py-1 pl-1">
          {@render TypeMenu({ property, icon: property.icon })}
        </span>
        <FrontmatterPropertyNameInput
          value={property.key}
          {config}
          excludedNames={siblingPropertyNames(property)}
          title={property.pathString}
          readonly={!canRename(property)}
          autofocus={newPropertyPath === property.pathString}
          onCommit={(value) => void renameProperty(value, property)}
        />
      </div>

      <div
        class="focus-within:bg-secondary metadata-property-value flex min-h-[29px] min-w-0 shrink grow items-center gap-1 self-stretch"
      >
        {#if hasCustomWidget(property)}
          <div
            class={`metadata-property-value-item metadata-property-value-custom min-w-0 grow ${valueClass(property.kind)}`}
            use:renderCustomWidget={property}
          ></div>
        {:else if property.kind === "checkbox"}
          <input
            class="metadata-input-checkbox mx-2"
            type="checkbox"
            aria-label={`${property.pathString} value`}
            checked={Boolean(property.value)}
            onchange={(event) => updateBooleanProperty(event, property)}
          />
        {:else if toBuiltinFrontmatterKind(property.kind) === "text"}
          <div
            class={`metadata-input metadata-input-longtext metadata-property-value-item min-w-0 grow bg-transparent px-2 py-1 outline-none ${valueClass(property.kind)}`}
            role="textbox"
            aria-label={`${property.pathString} value`}
            contenteditable="true"
            spellcheck="true"
            tabindex="0"
            data-placeholder="Empty"
            onblur={(event) => updateEditableTextProperty(event, property)}
            onkeydown={handleEditableTextKeydown}
          >
            {formatFrontmatterValue(property.value)}
          </div>
        {:else if toBuiltinFrontmatterKind(property.kind) === "number"}
          <input
            class={`metadata-input metadata-input-number metadata-property-value-item min-w-0 grow bg-transparent px-2 py-1 outline-none ${valueClass(property.kind)}`}
            type="number"
            inputmode="decimal"
            aria-label={`${property.pathString} value`}
            value={formatFrontmatterValue(property.value)}
            onchange={(event) => updateTextProperty(event, property)}
            onblur={(event) => updateTextProperty(event, property)}
          />
        {:else if toBuiltinFrontmatterKind(property.kind) === "date" || toBuiltinFrontmatterKind(property.kind) === "datetime"}
          <div
            class={`metadata-property-value-item metadata-property-value-date min-w-0 grow ${valueClass(property.kind)}`}
          >
            <input
              class={`metadata-input metadata-input-text min-w-0 grow bg-transparent px-2 py-1 outline-none ${valueClass(property.kind)}`}
              type={inputType(property.kind)}
              aria-label={`${property.pathString} value`}
              value={formatFrontmatterValue(property.value)}
              onchange={(event) => updateTextProperty(event, property)}
              onblur={(event) => updateTextProperty(event, property)}
            />
          </div>
        {:else if property.kind === "array" || property.kind === "object" || property.kind === "unknown"}
          <textarea
            class={`metadata-input metadata-input-longtext metadata-property-value-item min-w-0 grow bg-transparent px-2 py-1 outline-none ${valueClass(property.kind)}`}
            aria-label={`${property.pathString} value`}
            value={formatFrontmatterValue(property.value)}
            rows="3"
            onblur={(event) => updateTextProperty(event, property)}
          ></textarea>
        {:else if property.kind === "tags" || property.kind === "aliases" || property.kind === "multitext"}
          <div
            class={`metadata-property-value-item metadata-property-value-list flex min-w-0 grow flex-wrap items-center gap-1 py-1 ${valueClass(property.kind)}`}
          >
            {#each listValues(property) as item, index (`${item}:${index}`)}
              {@render Pill({ property, item, index })}
            {/each}
            <FrontmatterPropertyValueInput
              value={listDrafts[property.pathString] ?? ""}
              propertyKey={property.key}
              {config}
              excludedValues={listValues(property)}
              ariaLabel={`${property.pathString} value`}
              onInput={(next) => setListDraft(property.pathString, next)}
              onCommit={(next) => commitListValues(property, next)}
              onBackspaceEmpty={() => {
                if (listValues(property).length) {
                  removeListValue(property, listValues(property).length - 1);
                }
              }}
            />
          </div>
        {:else}
          <input
            class={`metadata-input metadata-input-text metadata-property-value-item min-w-0 grow bg-transparent px-2 py-1 outline-none ${valueClass(property.kind)}`}
            type={inputType(property.kind)}
            aria-label={`${property.pathString} value`}
            value={formatFrontmatterValue(property.value)}
            onblur={(event) => updateTextProperty(event, property)}
          />
        {/if}
      </div>
    </div>
  {/if}
{/snippet}

{#snippet TypeMenu({
  property,
  icon,
}: {
  property: FrontmatterProperty;
  icon: string;
})}
  <DropdownMenu.Root
    open={typeMenuPath === property.pathString}
    onOpenChange={(open: boolean) => {
      if (open) {
        typeMenuPath = property.pathString;
      } else if (typeMenuPath === property.pathString) {
        typeMenuPath = null;
      }
    }}
  >
    <DropdownMenu.Trigger
      type="button"
      class="metadata-property-type-button"
      aria-label={`Property options for ${property.key}`}
      onclick={(event) => event.stopPropagation()}
    >
      <Icon name={icon} class="size-3.5" />
    </DropdownMenu.Trigger>
    <DropdownMenu.Content
      class="metadata-property-menu"
      align="start"
      side="bottom"
      sideOffset={4}
      aria-label={`Property options for ${property.key}`}
    >
      <DropdownMenu.Group>
        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>
            <span
              class="metadata-property-menu__icon-placeholder"
              aria-hidden="true"
            ></span>
            <span>Property type</span>
          </DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent
            class="metadata-property-type-menu"
            aria-label={`Property type for ${property.key}`}
          >
            {#each typeOptions as option}
              <DropdownMenu.CheckboxItem
                checked={property.kind === option.type}
                onclick={() => changePropertyKind(property, option.type)}
              >
                <Icon
                  name={option.icon ??
                    frontmatterPropertyIcon(option.type, config)}
                  class="metadata-property-type-menu__type-icon size-4"
                />
                <span
                  >{option.label ??
                    frontmatterPropertyLabel(option.type, config)}</span
                >
              </DropdownMenu.CheckboxItem>
            {/each}
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>
      </DropdownMenu.Group>
      <DropdownMenu.Separator />
      <DropdownMenu.Group>
        <DropdownMenu.Item onclick={() => void copyProperty(property, true)}>
          <span
            class="metadata-property-menu__icon-placeholder"
            aria-hidden="true"
          ></span>
          <span>Cut</span>
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => void copyProperty(property)}>
          <span
            class="metadata-property-menu__icon-placeholder"
            aria-hidden="true"
          ></span>
          <span>Copy</span>
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => void pasteProperties(property)}>
          <span
            class="metadata-property-menu__icon-placeholder"
            aria-hidden="true"
          ></span>
          <span>Paste</span>
        </DropdownMenu.Item>
      </DropdownMenu.Group>
      <DropdownMenu.Separator />
      <DropdownMenu.Group>
        <DropdownMenu.Item onclick={() => removeProperty(property)}>
          <span
            class="metadata-property-menu__icon-placeholder"
            aria-hidden="true"
          ></span>
          <span>Remove</span>
        </DropdownMenu.Item>
      </DropdownMenu.Group>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/snippet}

{#snippet Pill({
  property,
  item,
  index,
}: {
  property: FrontmatterProperty;
  item: string;
  index: number;
})}
  {@const wikilink = parseFrontmatterPillWikilink(item)}
  <span
    class={`metadata-property-pill-chip inline-flex min-w-0 items-center gap-0.5 rounded-sm ${property.kind === "tags" ? "tag" : "bg-secondary text-secondary-foreground transition-colors hover:bg-[var(--background-modifier-hover)]"}`.trim()}
  >
    {#if wikilink}
      <Link
        id={wikilink.target}
        text={wikilink.text}
        {sourcePath}
        class="metadata-property-pill-link"
      />
    {:else}
      {displayListValue(property, item)}
    {/if}
    <button
      type="button"
      class={`metadata-property-pill-remove text-muted-foreground hover:text-foreground inline-flex size-3.5 shrink-0 items-center justify-center rounded-full border-0 bg-transparent p-px [&_svg]:size-2.5 ${property.kind === "tags" ? "hover:bg-[color-mix(in_srgb,currentColor_12%,transparent)]" : "hover:bg-[var(--background-modifier-hover)] hover:text-foreground"}`}
      aria-label={`Remove ${item}`}
      onclick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        removeListValue(property, index);
      }}
    >
      <Icon name="x" />
    </button>
  </span>
{/snippet}
