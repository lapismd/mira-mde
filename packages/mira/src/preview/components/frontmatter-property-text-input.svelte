<script lang="ts">
  import {
    filterFrontmatterValueSuggestions,
    readFrontmatterValueSuggestions,
    type FrontmatterConfig,
  } from "./frontmatter-utils";
  import * as Popover from "../../ui/popover/index.js";

  type Props = {
    value: string;
    propertyKey: string;
    config?: FrontmatterConfig;
    ariaLabel: string;
    class?: string;
    onCommit: (value: string) => void;
  };

  let {
    value,
    propertyKey,
    config,
    ariaLabel,
    class: className = "",
    onCommit,
  }: Props = $props();

  let editorEl: HTMLDivElement | null = $state(null);
  let query = $state("");
  let open = $state(false);
  let activeIndex = $state(-1);
  let suggestionVersion = 0;
  let suggestions = $state<string[]>([]);
  let committedSuggestion: string | null = null;

  const filteredSuggestions = $derived(
    filterFrontmatterValueSuggestions(suggestions, query),
  );
  const suggestionListId = $derived(
    `mira-property-value-suggestions-${propertyKey.replace(/[^a-z0-9_-]+/giu, "-")}`,
  );

  $effect(() => {
    if (activeIndex >= filteredSuggestions.length) {
      activeIndex = -1;
    }
  });

  $effect(() => {
    if (editorEl?.ownerDocument.activeElement !== editorEl) {
      query = value;
    }
  });

  async function loadSuggestions(nextQuery = currentValue()): Promise<void> {
    const version = ++suggestionVersion;
    try {
      const next = await readFrontmatterValueSuggestions(
        config,
        propertyKey,
        nextQuery,
      );
      if (version === suggestionVersion) {
        suggestions = next;
      }
    } catch {
      if (version === suggestionVersion) {
        suggestions = [];
      }
    }
  }

  function currentValue(): string {
    return editorEl?.textContent ?? query;
  }

  function selectSuggestion(index: number): void {
    const suggestion = filteredSuggestions[index];
    if (!suggestion) {
      return;
    }
    query = suggestion;
    if (editorEl) {
      editorEl.textContent = suggestion;
    }
    committedSuggestion = suggestion;
    open = false;
    onCommit(suggestion);
  }

  function handleBlur(event: FocusEvent): void {
    const nextFocus = event.relatedTarget as HTMLElement | null;
    if (nextFocus?.dataset.propertyValueSuggestion === "true") {
      return;
    }
    queueMicrotask(() => {
      if (editorEl?.ownerDocument.activeElement !== editorEl) {
        open = false;
        const nextValue = currentValue();
        if (nextValue === committedSuggestion) {
          committedSuggestion = null;
          return;
        }
        committedSuggestion = null;
        onCommit(nextValue);
      }
    });
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === "ArrowDown" && filteredSuggestions.length) {
      event.preventDefault();
      open = true;
      activeIndex =
        activeIndex < 0 ? 0 : (activeIndex + 1) % filteredSuggestions.length;
      return;
    }
    if (event.key === "ArrowUp" && filteredSuggestions.length) {
      event.preventDefault();
      open = true;
      activeIndex =
        activeIndex < 0
          ? filteredSuggestions.length - 1
          : (activeIndex - 1 + filteredSuggestions.length) %
            filteredSuggestions.length;
      return;
    }
    if (
      (event.key === "Enter" || event.key === "Tab") &&
      open &&
      activeIndex >= 0 &&
      activeIndex < filteredSuggestions.length
    ) {
      event.preventDefault();
      selectSuggestion(activeIndex);
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      editorEl?.blur();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      open = false;
    }
  }

  function textControlProps<T extends { type?: unknown }>(props: T) {
    const { type: _triggerType, ...controlProps } = props;
    return controlProps;
  }
</script>

<Popover.Root bind:open>
  <Popover.Trigger>
    {#snippet child({ props })}
      <div
        {...textControlProps(props)}
        bind:this={editorEl}
        class={className}
        role="combobox"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-controls={suggestionListId}
        aria-haspopup="listbox"
        contenteditable="true"
        spellcheck="true"
        tabindex="0"
        data-placeholder="Empty"
        data-open={open && filteredSuggestions.length ? "true" : undefined}
        onclick={() => {
          query = currentValue();
          open = true;
          activeIndex = -1;
          void loadSuggestions(query);
        }}
        onfocus={() => {
          query = currentValue();
          open = true;
          activeIndex = -1;
          void loadSuggestions(query);
        }}
        oninput={() => {
          committedSuggestion = null;
          query = currentValue();
          open = true;
          activeIndex = -1;
          void loadSuggestions(query);
        }}
        onblur={handleBlur}
        onkeydown={handleKeydown}
      >
        {value}
      </div>
    {/snippet}
  </Popover.Trigger>

  {#if open && filteredSuggestions.length}
    <Popover.Content
      id={suggestionListId}
      class="mira-property-value-suggestions"
      role="listbox"
      aria-label="Property value suggestions"
      align="start"
      side="bottom"
      sideOffset={4}
      collisionPadding={8}
      onOpenAutoFocus={(event) => event.preventDefault()}
      onCloseAutoFocus={(event) => event.preventDefault()}
    >
      {#each filteredSuggestions as suggestion, index (suggestion)}
        <button
          type="button"
          class="mira-property-value-suggestion"
          data-active={index === activeIndex ? "true" : undefined}
          data-property-value-suggestion="true"
          role="option"
          aria-selected={index === activeIndex}
          tabindex="-1"
          onmousedown={(event) => event.preventDefault()}
          onclick={() => selectSuggestion(index)}
        >
          <span>{suggestion}</span>
        </button>
      {/each}
    </Popover.Content>
  {/if}
</Popover.Root>
