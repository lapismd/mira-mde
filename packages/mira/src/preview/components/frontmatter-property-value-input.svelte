<script lang="ts">
  import {
    filterFrontmatterValueSuggestions,
    readFrontmatterValueSuggestions,
    type FrontmatterConfig,
  } from "./frontmatter-utils";
  import * as Popover from "../../ui/popover/index.js";

  type Props = {
    propertyKey: string;
    config?: FrontmatterConfig;
    excludedValues?: string[];
    ariaLabel: string;
    onCommit: (value: string) => void;
    onBackspaceEmpty: () => void;
  };

  let {
    propertyKey,
    config,
    excludedValues = [],
    ariaLabel,
    onCommit,
    onBackspaceEmpty,
  }: Props = $props();

  let inputEl: HTMLInputElement | null = $state(null);
  let draft = $state("");
  let open = $state(false);
  let activeIndex = $state(-1);
  let suggestionVersion = 0;
  let suggestions = $state<string[]>([]);

  const filteredSuggestions = $derived(
    filterFrontmatterValueSuggestions(suggestions, draft, excludedValues),
  );
  const suggestionListId = $derived(
    `mira-property-value-suggestions-${propertyKey.replace(/[^a-z0-9_-]+/giu, "-")}`,
  );

  $effect(() => {
    if (activeIndex >= filteredSuggestions.length) {
      activeIndex = -1;
    }
  });

  async function loadSuggestions(nextQuery = draft): Promise<void> {
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

  function selectSuggestion(index: number): void {
    const suggestion = filteredSuggestions[index];
    if (suggestion) {
      commitDraft(suggestion);
    }
  }

  function commitDraft(nextValue = draft): void {
    const committedValue = nextValue.trim();
    if (!committedValue) {
      return;
    }
    draft = "";
    open = false;
    activeIndex = -1;
    onCommit(committedValue);
  }

  function handleBlur(event: FocusEvent): void {
    const nextFocus = event.relatedTarget as HTMLElement | null;
    if (nextFocus?.dataset.propertyValueSuggestion === "true") {
      return;
    }
    queueMicrotask(() => {
      if (inputEl?.ownerDocument.activeElement !== inputEl) {
        open = false;
        if (draft.trim()) {
          commitDraft();
        }
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
    if (
      event.key === "Enter" ||
      event.key === "Tab" ||
      event.key === "," ||
      event.key === ";"
    ) {
      if (draft.trim()) {
        event.preventDefault();
        commitDraft();
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      open = false;
      activeIndex = -1;
      draft = "";
      inputEl?.blur();
      return;
    }
    if (event.key === "Backspace" && !draft) {
      event.preventDefault();
      onBackspaceEmpty();
    }
  }

  function textControlProps<T extends { type?: unknown }>(props: T) {
    const { type: _triggerType, ...inputProps } = props;
    return inputProps;
  }
</script>

<div
  class="mira-property-value-input"
  data-open={open && filteredSuggestions.length ? "true" : undefined}
>
  <Popover.Root bind:open>
    <Popover.Trigger>
      {#snippet child({ props })}
        <input
          {...textControlProps(props)}
          bind:this={inputEl}
          type="text"
          class="metadata-input metadata-input-list min-w-[8ch] flex-1 bg-transparent px-1 py-0 text-xs outline-none"
          aria-label={ariaLabel}
          value={draft}
          spellcheck="false"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={suggestionListId}
          aria-haspopup="listbox"
          aria-expanded={open && filteredSuggestions.length > 0}
          onclick={() => {
            open = true;
            activeIndex = -1;
            void loadSuggestions();
          }}
          onfocus={() => {
            open = true;
            activeIndex = -1;
            void loadSuggestions();
          }}
          oninput={(event) => {
            const nextValue = (event.currentTarget as HTMLInputElement).value;
            draft = nextValue;
            open = true;
            activeIndex = -1;
            void loadSuggestions(nextValue);
          }}
          onblur={handleBlur}
          onkeydown={handleKeydown}
        />
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
</div>
