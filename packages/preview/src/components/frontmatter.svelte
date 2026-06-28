<script lang="ts">
  import {
    addFrontmatterRecordProperty,
    coerceFrontmatterValue,
    createFrontmatterReplacement,
    formatFrontmatterValue,
    frontmatterProperties,
    frontmatterPropertyLabel,
    frontmatterPropertyIcon,
    frontmatterTypeOptions,
    parseFrontmatterValue,
    parseFrontmatterYaml,
    resolveFrontmatterWidget,
    renameFrontmatterRecordProperty,
    serializeFrontmatterRecord,
    toBuiltinFrontmatterKind,
    updateFrontmatterRecord,
    type FrontmatterProperty,
    type FrontmatterPropertyKind,
  } from "./frontmatter-utils";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import Icon from "./icon.svelte";
  import { useMarkdownContext } from "../renderer/context.svelte";

  type Props = {
    frontmatter?: string;
    value?: string;
    ref?: HTMLElement | null;
    "data-offset"?: string | number;
    "data-offset-end"?: string | number;
  };

  let {
    frontmatter = "",
    value: valueProp = "",
    ref = $bindable(null),
    "data-offset": dataOffset,
    "data-offset-end": dataOffsetEnd,
  }: Props = $props();

  const markdown = useMarkdownContext();
  let rawDraft = $state("");
  let frontmatterOpen = $state(markdown.frontmatterOpen);
  let opened = $state<Record<string, boolean>>({});
  let listDrafts = $state<Record<string, string>>({});
  let typeMenuPath = $state<string | null>(null);
  let newPropertyPath = $state<string | null>(null);
  const parsed = $derived(parseFrontmatterYaml(frontmatter || valueProp));
  const rows = $derived(
    parsed.ok
      ? frontmatterProperties(parsed.value, markdown.frontmatterConfig)
      : [],
  );
  const typeOptions = $derived(
    frontmatterTypeOptions(markdown.frontmatterConfig),
  );

  $effect(() => {
    rawDraft = frontmatter || valueProp;
  });

  function emitYaml(nextYaml: string): void {
    const replacement = createFrontmatterReplacement(nextYaml);
    const from = toNumber(dataOffset);
    const to = toNumber(dataOffsetEnd);
    if (from === null || to === null) {
      return;
    }

    const nextMarkdown = `${markdown.markdown.slice(0, from)}${replacement}${markdown.markdown.slice(to)}`;
    markdown.onChange?.(replacement, from, to);
    markdown.onFrontmatterChange?.(nextYaml, nextMarkdown);
  }

  function updateProperty(
    property: FrontmatterProperty,
    nextValue: unknown,
  ): void {
    if (!parsed.ok) {
      return;
    }

    emitYaml(
      serializeFrontmatterRecord(
        updateFrontmatterRecord(parsed.value, property.path, nextValue),
      ),
    );
  }

  function updateRecord(nextRecord: Record<string, unknown>): void {
    emitYaml(serializeFrontmatterRecord(nextRecord));
  }

  function addProperty(): void {
    if (!parsed.ok) {
      return;
    }

    const next = addFrontmatterRecordProperty(
      parsed.value,
      "text",
      markdown.frontmatterConfig,
    );
    newPropertyPath = next.name;
    updateRecord(next.value);
  }

  function renameProperty(event: Event, property: FrontmatterProperty): void {
    if (!parsed.ok || !canRename(property)) {
      return;
    }

    const target = event.currentTarget as HTMLInputElement;
    const nextKey = target.value.trim();
    if (!nextKey || nextKey === property.key) {
      target.value = property.key;
      return;
    }

    const nextRecord = renameFrontmatterRecordProperty(
      parsed.value,
      property.path,
      nextKey,
    );
    if (nextRecord === parsed.value) {
      target.value = property.key;
      return;
    }

    if (newPropertyPath === property.pathString) {
      newPropertyPath = nextKey;
    }
    updateRecord(nextRecord);
  }

  function changePropertyKind(
    property: FrontmatterProperty,
    kind: FrontmatterPropertyKind,
  ): void {
    updateProperty(
      property,
      coerceFrontmatterValue(
        property.value,
        kind,
        markdown.frontmatterConfig,
        property,
      ),
    );
    typeMenuPath = null;
  }

  function canRename(property: FrontmatterProperty): boolean {
    return typeof property.path.at(-1) === "string";
  }

  function handlePropertyNameKeydown(
    event: KeyboardEvent,
    property: FrontmatterProperty,
  ): void {
    if (event.key === "Enter") {
      event.preventDefault();
      (event.currentTarget as HTMLInputElement).blur();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      const target = event.currentTarget as HTMLInputElement;
      target.value = property.key;
      target.blur();
    }
  }

  function toggleTypeMenu(
    event: MouseEvent,
    property: FrontmatterProperty,
  ): void {
    event.stopPropagation();
    typeMenuPath =
      typeMenuPath === property.pathString ? null : property.pathString;
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

  function addListValue(property: FrontmatterProperty, event: Event): void {
    const draft = listDrafts[property.pathString] ?? "";
    const nextValues = draft
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
    event.preventDefault();
  }

  function removeListValue(property: FrontmatterProperty, index: number): void {
    updateProperty(
      property,
      listValues(property).filter((_, itemIndex) => itemIndex !== index),
    );
  }

  function handleListKeydown(
    event: KeyboardEvent,
    property: FrontmatterProperty,
  ): void {
    if (
      event.key === "Enter" ||
      event.key === "Tab" ||
      event.key === "," ||
      event.key === ";"
    ) {
      addListValue(property, event);
      return;
    }

    if (
      event.key === "Backspace" &&
      !listDrafts[property.pathString] &&
      listValues(property).length
    ) {
      event.preventDefault();
      removeListValue(property, listValues(property).length - 1);
    }
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
    return Boolean(
      resolveFrontmatterWidget(markdown.frontmatterConfig, property.kind)
        ?.render,
    );
  }

  function renderCustomWidget(
    element: HTMLElement,
    property: FrontmatterProperty,
  ) {
    let cleanup: (() => void) | void;

    function mountWidget(nextProperty: FrontmatterProperty) {
      cleanup?.();
      cleanup = resolveFrontmatterWidget(
        markdown.frontmatterConfig,
        nextProperty.kind,
      )?.render?.(element, {
        property: nextProperty,
        sourcePath: markdown.sourcePath,
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
</script>

<div bind:this={ref} class="md-frontmatter" data-editable-markdown-ignore-click>
  <div
    class="md-frontmatter__collapsible"
    data-state={frontmatterOpen ? "open" : "closed"}
  >
    <button
      type="button"
      class="md-frontmatter__trigger"
      aria-label={frontmatterOpen ? "Collapse properties" : "Expand properties"}
      aria-expanded={frontmatterOpen}
      onclick={() => (frontmatterOpen = !frontmatterOpen)}
    >
      <ChevronRight class="md-frontmatter__chevron" aria-hidden="true" />
      <span class="md-frontmatter__title">Properties</span>
    </button>

    {#if frontmatterOpen}
      <div class="md-frontmatter__content">
        <div class="mira-frontmatter metadata-container @container p-1 text-sm">
          {#if parsed.ok}
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
              <p class="mira-frontmatter__error">{parsed.error}</p>
              <textarea
                class="metadata-input metadata-input-longtext mira-frontmatter__textarea mira-frontmatter__textarea--raw"
                bind:value={rawDraft}
                rows="6"
                onblur={() => emitYaml(rawDraft)}
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
      class="metadata-property metadata-property--parent focus-within:ring-border relative flex flex-row flex-wrap overflow-hidden border-b focus-within:rounded-sm focus-within:border focus-within:ring-2 @[250px]:flex-nowrap"
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
          <button
            type="button"
            class="metadata-property-type-button"
            aria-label={`Change ${property.key} type`}
            aria-expanded={typeMenuPath === property.pathString}
            onclick={(event) => toggleTypeMenu(event, property)}
          >
            <Icon name="list-tree" class="size-3.5" />
          </button>
          {#if typeMenuPath === property.pathString}
            {@render TypeMenu({ property })}
          {/if}
        </span>
        <input
          class="metadata-property-key-input flex w-full grow items-center bg-transparent px-2 py-1 text-left text-ellipsis outline-none"
          title={property.pathString}
          value={property.key}
          readonly={!canRename(property)}
          onblur={(event) => renameProperty(event, property)}
          onkeydown={(event) => handlePropertyNameKeydown(event, property)}
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
      class="metadata-property focus-within:ring-border relative flex flex-row flex-wrap overflow-hidden border-b focus-within:rounded-sm focus-within:border focus-within:ring-2 @[260px]:flex-nowrap"
      data-property={property.pathString}
      data-property-type={property.type}
      data-valid={property.valid}
      style={`--mira-property-depth: ${property.depth}`}
    >
      <div
        class="metadata-property-key focus-within:bg-secondary text-muted-foreground flex w-[9em] min-w-[9em] shrink-0 flex-row self-stretch"
      >
        <span class="metadata-property-icon flex items-center py-1 pl-1">
          <button
            type="button"
            class="metadata-property-type-button"
            aria-label={`Change ${property.key} type`}
            aria-expanded={typeMenuPath === property.pathString}
            onclick={(event) => toggleTypeMenu(event, property)}
          >
            <Icon name={property.icon} class="size-3.5" />
          </button>
          {#if typeMenuPath === property.pathString}
            {@render TypeMenu({ property })}
          {/if}
        </span>
        <input
          class="metadata-property-key-input flex w-full grow items-center bg-transparent px-2 py-1 text-left text-ellipsis outline-none"
          title={property.pathString}
          value={property.key}
          readonly={!canRename(property)}
          data-new={newPropertyPath === property.pathString
            ? "true"
            : undefined}
          onblur={(event) => renameProperty(event, property)}
          onkeydown={(event) => handlePropertyNameKeydown(event, property)}
        />
      </div>

      <div
        class="focus-within:bg-secondary metadata-property-value flex min-h-[29px] min-w-0 shrink grow items-center gap-1 self-stretch ps-[20px] @[250px]:ps-0"
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
              <span
                class={`metadata-property-pill-chip inline-flex min-w-0 items-center gap-0.5 rounded-sm ${property.kind === "tags" ? "tag" : "bg-secondary text-secondary-foreground transition-colors hover:bg-[var(--background-modifier-hover)]"}`.trim()}
              >
                {displayListValue(property, item)}
                <button
                  type="button"
                  class={`metadata-property-pill-remove text-muted-foreground hover:text-foreground inline-flex size-3.5 shrink-0 items-center justify-center rounded-full border-0 bg-transparent p-px [&_svg]:size-2.5 ${property.kind === "tags" ? "hover:bg-[color-mix(in_srgb,currentColor_12%,transparent)]" : "hover:bg-[var(--background-modifier-hover)] hover:text-foreground"}`}
                  aria-label={`Remove ${item}`}
                  onclick={() => removeListValue(property, index)}
                >
                  <Icon name="x" />
                </button>
              </span>
            {/each}
            <input
              class="metadata-input metadata-input-list min-w-[8ch] flex-1 bg-transparent px-1 py-0 text-xs outline-none"
              aria-label={`${property.pathString} value`}
              value={listDrafts[property.pathString] ?? ""}
              spellcheck="false"
              oninput={(event) =>
                setListDraft(
                  property.pathString,
                  (event.currentTarget as HTMLInputElement).value,
                )}
              onblur={(event) => addListValue(property, event)}
              onkeydown={(event) => handleListKeydown(event, property)}
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

{#snippet TypeMenu({ property }: { property: FrontmatterProperty })}
  <div
    class="metadata-property-type-menu"
    role="menu"
    aria-label={`Property type for ${property.key}`}
  >
    {#each typeOptions as option}
      <button
        type="button"
        class="metadata-property-type-menu__item"
        data-selected={property.kind === option.type}
        role="menuitemradio"
        aria-checked={property.kind === option.type}
        onclick={() => changePropertyKind(property, option.type)}
      >
        <Icon
          name={option.icon ??
            frontmatterPropertyIcon(option.type, markdown.frontmatterConfig)}
          class="size-3.5"
        />
        <span
          >{option.label ??
            frontmatterPropertyLabel(option.type, markdown.frontmatterConfig)}</span
        >
        {#if property.kind === option.type}
          <Icon name="check" class="metadata-property-type-menu__check" />
        {/if}
      </button>
    {/each}
  </div>
{/snippet}
