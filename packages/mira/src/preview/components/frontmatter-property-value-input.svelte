<script lang="ts">
  import {
    filterFrontmatterValueSuggestions,
    readFrontmatterValueSuggestions,
    type FrontmatterConfig,
  } from "./frontmatter-utils";

  type Props = {
    value: string;
    propertyKey: string;
    config?: FrontmatterConfig;
    excludedValues?: string[];
    ariaLabel: string;
    onInput: (value: string) => void;
    onCommit: (value: string) => void;
    onBackspaceEmpty: () => void;
  };

  let {
    value,
    propertyKey,
    config,
    excludedValues = [],
    ariaLabel,
    onInput,
    onCommit,
    onBackspaceEmpty,
  }: Props = $props();

  let inputEl: HTMLInputElement | null = $state(null);
  let open = $state(false);
  let activeIndex = $state(0);
  let suggestionVersion = 0;
  let suggestions = $state<string[]>([]);

  const filteredSuggestions = $derived(
    filterFrontmatterValueSuggestions(suggestions, value, excludedValues),
  );
  const suggestionListId = $derived(
    `mira-property-value-suggestions-${propertyKey.replace(/[^a-z0-9_-]+/giu, "-")}`,
  );

  $effect(() => {
    if (activeIndex >= filteredSuggestions.length) {
      activeIndex = Math.max(0, filteredSuggestions.length - 1);
    }
  });

  async function loadSuggestions(): Promise<void> {
    const version = ++suggestionVersion;
    try {
      const next = await readFrontmatterValueSuggestions(
        config,
        propertyKey,
        value,
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

  function selectSuggestion(index: number): void {
    const suggestion = filteredSuggestions[index];
    if (suggestion) {
      open = false;
      onCommit(suggestion);
    }
  }

  function handleBlur(event: FocusEvent): void {
    const nextFocus = event.relatedTarget as HTMLElement | null;
    if (nextFocus?.dataset.propertyValueSuggestion === "true") {
      return;
    }
    queueMicrotask(() => {
      if (document.activeElement !== inputEl) {
        open = false;
        if (value.trim()) {
          onCommit(value);
        }
      }
    });
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === "ArrowDown" && filteredSuggestions.length) {
      event.preventDefault();
      open = true;
      activeIndex = (activeIndex + 1) % filteredSuggestions.length;
      return;
    }
    if (event.key === "ArrowUp" && filteredSuggestions.length) {
      event.preventDefault();
      open = true;
      activeIndex =
        (activeIndex - 1 + filteredSuggestions.length) %
        filteredSuggestions.length;
      return;
    }
    if (
      (event.key === "Enter" || event.key === "Tab") &&
      open &&
      filteredSuggestions.length
    ) {
      event.preventDefault();
      selectSuggestion(activeIndex);
      return;
    }
    if (
      event.key === "Enter" ||
      event.key === "Tab" ||
      event.key === "," ||
      event.key === ";"
    ) {
      if (value.trim()) {
        event.preventDefault();
        open = false;
        onCommit(value);
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      open = false;
      inputEl?.blur();
      return;
    }
    if (event.key === "Backspace" && !value) {
      event.preventDefault();
      onBackspaceEmpty();
    }
  }
</script>

<div
  class="mira-property-value-input"
  data-open={open && filteredSuggestions.length ? "true" : undefined}
>
  <input
    bind:this={inputEl}
    class="metadata-input metadata-input-list min-w-[8ch] flex-1 bg-transparent px-1 py-0 text-xs outline-none"
    aria-label={ariaLabel}
    {value}
    spellcheck="false"
    role="combobox"
    aria-autocomplete="list"
    aria-controls={suggestionListId}
    aria-expanded={open && filteredSuggestions.length > 0}
    onfocus={() => {
      open = true;
      void loadSuggestions();
    }}
    oninput={(event) => {
      open = true;
      activeIndex = 0;
      onInput((event.currentTarget as HTMLInputElement).value);
      void loadSuggestions();
    }}
    onblur={handleBlur}
    onkeydown={handleKeydown}
  />

  {#if open && filteredSuggestions.length}
    <div
      id={suggestionListId}
      class="mira-property-value-suggestions"
      role="listbox"
      aria-label="Property value suggestions"
    >
      {#each filteredSuggestions as suggestion, index (suggestion)}
        <button
          type="button"
          class="mira-property-value-suggestion"
          data-active={index === activeIndex}
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
    </div>
  {/if}
</div>
