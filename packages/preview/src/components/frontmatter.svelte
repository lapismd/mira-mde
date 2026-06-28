<script lang="ts">
  import {
    createFrontmatterReplacement,
    formatFrontmatterValue,
    frontmatterProperties,
    parseFrontmatterValue,
    parseFrontmatterYaml,
    serializeFrontmatterRecord,
    updateFrontmatterRecord,
    type FrontmatterProperty,
    type FrontmatterPropertyKind,
  } from "./frontmatter-utils";
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
  const parsed = $derived(parseFrontmatterYaml(frontmatter || valueProp));
  const rows = $derived(parsed.ok ? frontmatterProperties(parsed.value) : []);

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

  function updateTextProperty(
    event: Event,
    property: FrontmatterProperty,
  ): void {
    const target = event.currentTarget as
      HTMLInputElement | HTMLTextAreaElement;
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

  function displayListValue(property: FrontmatterProperty, value: string): string {
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

  function removeListValue(
    property: FrontmatterProperty,
    index: number,
  ): void {
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
    if (kind === "number") {
      return "number";
    }
    if (kind === "date") {
      return "date";
    }
    if (kind === "datetime") {
      return "datetime-local";
    }
    return "text";
  }

  function valueClass(kind: FrontmatterPropertyKind): string {
    return `mod-${kind === "checkbox" ? "boolean" : kind}`;
  }
</script>

<div
  bind:this={ref}
  class="md-frontmatter"
  data-editable-markdown-ignore-click
>
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
      <Icon name="chevron-right" class="md-frontmatter__chevron" />
      <span class="md-frontmatter__title">Properties</span>
    </button>

    {#if frontmatterOpen}
      <div class="md-frontmatter__content">
        <div
          class="mira-frontmatter metadata-container @container p-1 text-sm"
        >
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
      <button
        type="button"
        class="metadata-property-collapse-indicator flex items-center py-1 pl-1"
        aria-label={`${isOpen(property.pathString) ? "Collapse" : "Expand"} ${property.key}`}
        aria-expanded={isOpen(property.pathString)}
        onclick={() => toggleOpen(property.pathString)}
      >
        <svg
          class="metadata-property-collapse-indicator__icon"
          aria-hidden="true"
          viewBox="0 0 24 24"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      <div
        class="metadata-property-key focus-within:bg-secondary text-muted-foreground flex w-full shrink-0 flex-row self-stretch"
      >
        <span class="metadata-property-icon flex items-center py-1 pl-1">
          <Icon name="list-tree" class="size-3.5" />
        </span>
        <span
          class="metadata-property-key-input flex w-full grow items-center bg-transparent px-2 py-1 text-left text-ellipsis outline-none"
          title={property.pathString}
        >
          {property.key}
        </span>
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
          <Icon name={property.icon} class="size-3.5" />
        </span>
        <span
          class="metadata-property-key-input flex w-full grow items-center bg-transparent px-2 py-1 text-left text-ellipsis outline-none"
          title={property.pathString}
        >
          {property.key}
        </span>
      </div>

      <div
        class="focus-within:bg-secondary metadata-property-value flex min-h-[29px] min-w-0 shrink grow items-center gap-1 self-stretch ps-[20px] @[250px]:ps-0"
      >
        {#if property.kind === "checkbox"}
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
              placeholder="Empty"
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
            placeholder="Empty"
            onblur={(event) => updateTextProperty(event, property)}
          />
        {/if}
      </div>
    </div>
  {/if}
{/snippet}
