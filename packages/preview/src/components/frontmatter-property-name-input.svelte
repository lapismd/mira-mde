<script lang="ts">
  import { tick } from "svelte";
  import Icon from "./icon.svelte";
  import {
    filterFrontmatterPropertySuggestions,
    readFrontmatterPropertySuggestions,
    type FrontmatterConfig,
    type FrontmatterPropertySuggestion,
  } from "./frontmatter-utils";

  type Props = {
    value: string;
    config?: FrontmatterConfig;
    excludedNames?: string[];
    title?: string;
    readonly?: boolean;
    autofocus?: boolean;
    onCommit: (value: string) => void;
  };

  let {
    value,
    config,
    excludedNames = [],
    title,
    readonly = false,
    autofocus = false,
    onCommit,
  }: Props = $props();

  let inputEl: HTMLInputElement | null = $state(null);
  let draft = $state("");
  let focused = $state(false);
  let open = $state(false);
  let activeIndex = $state(0);
  let suggestionVersion = 0;
  let suggestions = $state<FrontmatterPropertySuggestion[]>([]);
  let didAutofocus = false;

  const filteredSuggestions = $derived(
    filterFrontmatterPropertySuggestions(suggestions, draft, excludedNames),
  );
  const suggestionListId = $derived(
    `mira-property-suggestions-${(title || value).replace(/[^a-z0-9_-]+/giu, "-")}`,
  );

  $effect(() => {
    if (!focused) {
      draft = value;
    }
  });

  $effect(() => {
    if (!autofocus || didAutofocus || readonly) {
      return;
    }
    didAutofocus = true;
    void tick().then(() => inputEl?.focus());
  });

  $effect(() => {
    if (activeIndex >= filteredSuggestions.length) {
      activeIndex = Math.max(0, filteredSuggestions.length - 1);
    }
  });

  async function loadSuggestions(): Promise<void> {
    const version = ++suggestionVersion;
    try {
      const next = await readFrontmatterPropertySuggestions(config);
      if (version === suggestionVersion) {
        suggestions = next;
      }
    } catch {
      if (version === suggestionVersion) {
        suggestions = [];
      }
    }
  }

  function commit(nextValue = draft): void {
    const normalized = nextValue.trim();
    draft = normalized || value;
    open = false;
    if (normalized && normalized !== value) {
      onCommit(normalized);
    }
  }

  function selectSuggestion(index: number): void {
    const suggestion = filteredSuggestions[index];
    if (suggestion) {
      commit(suggestion.name);
    }
  }

  function handleBlur(event: FocusEvent): void {
    focused = false;
    const nextFocus = event.relatedTarget as HTMLElement | null;
    if (nextFocus?.dataset.propertySuggestion === "true") {
      return;
    }
    queueMicrotask(() => {
      if (document.activeElement !== inputEl) {
        commit();
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
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
      inputEl?.blur();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      draft = value;
      open = false;
      inputEl?.blur();
    }
  }
</script>

<div
  class="mira-property-name-input"
  data-open={open && filteredSuggestions.length ? "true" : undefined}
>
  <input
    bind:this={inputEl}
    bind:value={draft}
    class="metadata-property-key-input"
    {title}
    {readonly}
    role="combobox"
    aria-autocomplete="list"
    aria-controls={suggestionListId}
    aria-expanded={open && filteredSuggestions.length > 0}
    onfocus={() => {
      focused = true;
      open = true;
      void loadSuggestions();
    }}
    oninput={() => {
      open = true;
      activeIndex = 0;
    }}
    onblur={handleBlur}
    onkeydown={handleKeydown}
  />

  {#if open && filteredSuggestions.length}
    <div
      id={suggestionListId}
      class="mira-property-name-suggestions"
      role="listbox"
      aria-label="Property name suggestions"
    >
      {#each filteredSuggestions as suggestion, index (suggestion.name)}
        <button
          type="button"
          class="mira-property-name-suggestion"
          data-active={index === activeIndex}
          data-property-suggestion="true"
          role="option"
          aria-selected={index === activeIndex}
          tabindex="-1"
          onmousedown={(event) => event.preventDefault()}
          onclick={() => selectSuggestion(index)}
        >
          {#if suggestion.icon}
            <Icon
              name={suggestion.icon}
              class="mira-property-name-suggestion__icon"
            />
          {/if}
          <span>{suggestion.name}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>
