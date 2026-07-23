<script lang="ts">
  import {
    closeSearchPanel,
    findNext,
    findPrevious,
    getSearchQuery,
    replaceAll,
    replaceNext,
    SearchQuery,
    selectMatches,
    setSearchQuery,
  } from "@codemirror/search";
  import { EditorView, runScopeHandlers } from "@codemirror/view";
  import ArrowDown from "@lucide/svelte/icons/arrow-down";
  import ArrowUp from "@lucide/svelte/icons/arrow-up";
  import CaseSensitive from "@lucide/svelte/icons/case-sensitive";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import Regex from "@lucide/svelte/icons/regex";
  import Replace from "@lucide/svelte/icons/replace";
  import ReplaceAll from "@lucide/svelte/icons/replace-all";
  import TextSelect from "@lucide/svelte/icons/text-select";
  import WholeWord from "@lucide/svelte/icons/whole-word";
  import X from "@lucide/svelte/icons/x";
  import { onMount, untrack } from "svelte";

  let { view }: { view: EditorView } = $props();

  const initialQuery = untrack(() => getSearchQuery(view.state));
  const readOnly = untrack(() => view.state.readOnly);

  let searchValue = $state(initialQuery.search);
  let replaceValue = $state(initialQuery.replace);
  let caseSensitive = $state(initialQuery.caseSensitive);
  let wholeWord = $state(initialQuery.wholeWord);
  let regexp = $state(initialQuery.regexp);
  let replaceOpen = $state(false);
  let noMatches = $state(false);

  let searchField: HTMLInputElement | null = $state(null);
  let replaceField: HTMLInputElement | null = $state(null);

  function queryForCurrentControls(): SearchQuery {
    return new SearchQuery({
      search: searchValue,
      literal: initialQuery.literal,
      regexp,
      caseSensitive,
      replace: replaceValue,
      wholeWord,
    });
  }

  function queryHasNoMatches(query: SearchQuery): boolean {
    if (!query.search || !query.valid) {
      return Boolean(query.search && !query.valid);
    }

    return query.getCursor(view.state).next().done === true;
  }

  function commitQuery(): void {
    const query = queryForCurrentControls();
    noMatches = queryHasNoMatches(query);
    view.dispatch({
      effects: setSearchQuery.of(query),
    });
  }

  function updateSearchValue(event: Event): void {
    searchValue = (event.currentTarget as HTMLInputElement).value;
    commitQuery();
  }

  function updateReplaceValue(event: Event): void {
    replaceValue = (event.currentTarget as HTMLInputElement).value;
    commitQuery();
  }

  function toggleCaseSensitive(): void {
    caseSensitive = !caseSensitive;
    commitQuery();
  }

  function toggleWholeWord(): void {
    wholeWord = !wholeWord;
    commitQuery();
  }

  function toggleRegexp(): void {
    regexp = !regexp;
    commitQuery();
  }

  function toggleReplace(): void {
    replaceOpen = !replaceOpen;
    if (replaceOpen) {
      queueMicrotask(() => replaceField?.focus());
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSearchPanel(view);
      return;
    }

    if (runScopeHandlers(view, event, "search-panel")) {
      event.preventDefault();
      return;
    }

    if (event.key !== "Enter") {
      return;
    }

    if (event.target === searchField) {
      event.preventDefault();
      (event.shiftKey ? findPrevious : findNext)(view);
      return;
    }

    if (event.target === replaceField) {
      event.preventDefault();
      replaceNext(view);
    }
  }

  onMount(() => {
    searchField?.setAttribute("main-field", "true");
  });
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions (delegates CodeMirror key handling from the interactive controls) -->
<div class="mira-search-panel" role="search" onkeydown={handleKeydown}>
  <div
    class="mira-search-panel__toggles"
    role="group"
    aria-label="Search options"
  >
    <button
      type="button"
      class="mira-search-panel__button mira-search-panel__toggle"
      class:mira-search-panel__toggle--active={caseSensitive}
      aria-label="Case sensitive"
      aria-pressed={caseSensitive}
      title="Case sensitive"
      onclick={toggleCaseSensitive}
    >
      <CaseSensitive aria-hidden="true" />
    </button>
    <button
      type="button"
      class="mira-search-panel__button mira-search-panel__toggle"
      class:mira-search-panel__toggle--active={wholeWord}
      aria-label="Match whole word"
      aria-pressed={wholeWord}
      title="Match whole word"
      onclick={toggleWholeWord}
    >
      <WholeWord aria-hidden="true" />
    </button>
    <button
      type="button"
      class="mira-search-panel__button mira-search-panel__toggle"
      class:mira-search-panel__toggle--active={regexp}
      aria-label="Use regular expression"
      aria-pressed={regexp}
      title="Use regular expression"
      onclick={toggleRegexp}
    >
      <Regex aria-hidden="true" />
    </button>
  </div>

  <div class="mira-search-panel__body">
    {#if !readOnly}
      <button
        type="button"
        class="mira-search-panel__button mira-search-panel__replace-toggle"
        aria-label="Toggle replace"
        aria-expanded={replaceOpen}
        title="Toggle replace"
        onclick={toggleReplace}
      >
        {#if replaceOpen}
          <ChevronDown aria-hidden="true" />
        {:else}
          <ChevronRight aria-hidden="true" />
        {/if}
      </button>
    {/if}

    <div class="mira-search-panel__fields">
      <div class="mira-search-panel__row">
        <input
          bind:this={searchField}
          class="mira-search-panel__input mira-search-panel__search-input"
          class:mira-search-panel__input--invalid={noMatches}
          type="text"
          name="search"
          form=""
          value={searchValue}
          placeholder="Find"
          aria-label="Find"
          aria-invalid={noMatches}
          oninput={updateSearchValue}
        />
        <button
          type="button"
          class="mira-search-panel__button"
          aria-label="Previous match"
          title="Previous (Shift+F3)"
          onclick={() => findPrevious(view)}
        >
          <ArrowUp aria-hidden="true" />
        </button>
        <button
          type="button"
          class="mira-search-panel__button"
          aria-label="Next match"
          title="Next (F3)"
          onclick={() => findNext(view)}
        >
          <ArrowDown aria-hidden="true" />
        </button>
        <button
          type="button"
          class="mira-search-panel__button"
          aria-label="Select all matches"
          title="Find all (Alt+Enter)"
          onclick={() => selectMatches(view)}
        >
          <TextSelect aria-hidden="true" />
        </button>
        <button
          type="button"
          class="mira-search-panel__button"
          aria-label="Close search"
          title="Exit search"
          onclick={() => closeSearchPanel(view)}
        >
          <X aria-hidden="true" />
        </button>
      </div>

      {#if replaceOpen && !readOnly}
        <div class="mira-search-panel__row mira-search-panel__replace-row">
          <input
            bind:this={replaceField}
            class="mira-search-panel__input"
            type="text"
            name="replace"
            form=""
            value={replaceValue}
            placeholder="Replace"
            aria-label="Replace"
            oninput={updateReplaceValue}
          />
          <button
            type="button"
            class="mira-search-panel__button"
            aria-label="Replace match"
            title="Replace (Enter)"
            onclick={() => replaceNext(view)}
          >
            <Replace aria-hidden="true" />
          </button>
          <button
            type="button"
            class="mira-search-panel__button"
            aria-label="Replace all matches"
            title="Replace all"
            onclick={() => replaceAll(view)}
          >
            <ReplaceAll aria-hidden="true" />
          </button>
        </div>
      {/if}
    </div>
  </div>

  <span class="mira-search-panel__status" role="status" aria-live="polite">
    {noMatches ? "No matches found" : ""}
  </span>
</div>

<style>
  .mira-search-panel {
    align-items: center;
    background: var(--background-primary, var(--mira-editor-background));
    box-sizing: border-box;
    color: var(--text-normal, var(--mira-foreground));
    display: flex;
    flex-direction: column;
    font-family: var(--font-interface, var(--mira-font-sans));
    gap: 0.375rem;
    padding: 0.5rem 1rem;
    width: 100%;
  }

  .mira-search-panel__toggles {
    align-items: center;
    background: var(--background-secondary, var(--mira-muted));
    border: 1px solid var(--background-modifier-border, var(--mira-border));
    border-radius: var(--radius-s, var(--mira-radius));
    display: inline-flex;
    gap: 2px;
    padding: 2px;
  }

  .mira-search-panel__body,
  .mira-search-panel__row {
    align-items: center;
    display: flex;
  }

  .mira-search-panel__body {
    gap: 0.25rem;
    justify-content: center;
    max-width: 100%;
  }

  .mira-search-panel__fields {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
  }

  .mira-search-panel__row {
    gap: 0.5rem;
    min-width: 0;
  }

  .mira-search-panel__replace-row {
    padding-right: 5rem;
  }

  .mira-search-panel__input {
    background: var(--background-primary, var(--mira-editor-background));
    border: 1px solid var(--background-modifier-border, var(--mira-border));
    border-radius: var(--radius-s, var(--mira-radius));
    box-sizing: border-box;
    color: var(--text-normal, var(--mira-foreground));
    font: inherit;
    height: 2rem;
    min-width: 10rem;
    padding: 0 0.625rem;
    width: min(22rem, 42vw);
  }

  .mira-search-panel__input::placeholder {
    color: var(--text-muted, var(--mira-muted-foreground));
  }

  .mira-search-panel__input:hover {
    border-color: var(
      --background-modifier-border-hover,
      var(--mira-border-strong)
    );
  }

  .mira-search-panel__input:focus-visible,
  .mira-search-panel__button:focus-visible {
    border-color: var(--interactive-accent, var(--mira-accent));
    box-shadow: 0 0 0 2px
      color-mix(
        in srgb,
        var(--interactive-accent, var(--mira-accent)) 30%,
        transparent
      );
    outline: none;
  }

  .mira-search-panel__input--invalid {
    border-color: rgb(var(--mira-callout-error, 220, 38, 38));
  }

  .mira-search-panel__button {
    align-items: center;
    background: transparent;
    border: 1px solid var(--background-modifier-border, var(--mira-border));
    border-radius: var(--radius-s, var(--mira-radius));
    color: var(--text-muted, var(--mira-muted-foreground));
    cursor: pointer;
    display: inline-flex;
    flex: 0 0 auto;
    height: 2rem;
    justify-content: center;
    padding: 0;
    width: 2rem;
  }

  .mira-search-panel__button:hover,
  .mira-search-panel__toggle--active {
    background: var(--background-modifier-hover, var(--mira-accent-soft));
    color: var(--text-normal, var(--mira-foreground));
  }

  .mira-search-panel__toggle {
    border-color: transparent;
    height: 1.75rem;
    width: 1.75rem;
  }

  .mira-search-panel__toggle--active {
    background: var(--background-primary, var(--mira-editor-background));
    box-shadow: 0 1px 2px rgb(0 0 0 / 8%);
  }

  .mira-search-panel__button :global(svg) {
    height: 1rem;
    pointer-events: none;
    width: 1rem;
  }

  .mira-search-panel__status {
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    height: 1px;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
    width: 1px;
  }

  @media (max-width: 640px) {
    .mira-search-panel {
      align-items: stretch;
      padding-inline: 0.5rem;
    }

    .mira-search-panel__toggles {
      align-self: center;
    }

    .mira-search-panel__body {
      align-items: flex-start;
    }

    .mira-search-panel__row {
      flex-wrap: wrap;
    }

    .mira-search-panel__input {
      flex: 1 1 100%;
      width: 100%;
    }

    .mira-search-panel__replace-row {
      padding-right: 0;
    }
  }
</style>
