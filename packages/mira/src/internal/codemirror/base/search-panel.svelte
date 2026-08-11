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
  import SearchIcon from "@lucide/svelte/icons/search";
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
        <div
          class="mira-search-panel__search-field"
          class:mira-search-panel__search-field--invalid={noMatches}
        >
          <span class="mira-search-panel__find-icon">
            <SearchIcon aria-hidden="true" />
          </span>
          <input
            bind:this={searchField}
            class="mira-search-panel__input mira-search-panel__search-input"
            type="text"
            name="search"
            form=""
            value={searchValue}
            placeholder="Find"
            aria-label="Find"
            aria-invalid={noMatches}
            oninput={updateSearchValue}
          />
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
        </div>
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
    background: var(
      --mira-code-editor-background,
      var(--background-primary, var(--mira-editor-background))
    );
    box-sizing: border-box;
    color: var(
      --mira-code-editor-foreground,
      var(--text-normal, var(--mira-foreground))
    );
    display: flex;
    flex-direction: column;
    font-family: var(--font-interface, var(--mira-font-sans));
    gap: 0.375rem;
    padding: 0.5rem 1rem;
    width: 100%;
  }

  .mira-search-panel__toggles {
    align-items: center;
    display: inline-flex;
    gap: 2px;
    padding-inline-end: 0.25rem;
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
    background: var(
      --mira-code-editor-search-input-background,
      var(
        --mira-code-editor-background,
        var(--background-primary, var(--mira-editor-background))
      )
    );
    border: 1px solid
      var(
        --mira-code-editor-search-input-border,
        var(
          --mira-code-editor-border,
          var(--background-modifier-border, var(--mira-border))
        )
      );
    border-radius: var(--mira-code-editor-search-radius, 999px);
    box-sizing: border-box;
    color: var(
      --mira-code-editor-search-input-foreground,
      var(
        --mira-code-editor-foreground,
        var(--text-normal, var(--mira-foreground))
      )
    );
    font: inherit;
    height: 2rem;
    min-width: 10rem;
    padding: 0 0.625rem;
    width: min(22rem, 42vw);
  }

  .mira-search-panel__search-field {
    align-items: center;
    background: var(
      --mira-code-editor-search-input-background,
      var(
        --mira-code-editor-background,
        var(--background-primary, var(--mira-editor-background))
      )
    );
    border: 1px solid
      var(
        --mira-code-editor-search-input-border,
        var(
          --mira-code-editor-border,
          var(--background-modifier-border, var(--mira-border))
        )
      );
    border-radius: var(--mira-code-editor-search-radius, 999px);
    box-sizing: border-box;
    display: flex;
    height: 2rem;
    min-width: 10rem;
    padding-inline-start: 0.5rem;
    width: min(22rem, 42vw);
  }

  .mira-search-panel__find-icon {
    align-items: center;
    color: var(
      --mira-code-editor-search-muted,
      var(--text-muted, var(--mira-muted-foreground))
    );
    display: inline-flex;
    flex: 0 0 auto;
  }

  .mira-search-panel__find-icon :global(svg) {
    height: 1rem;
    width: 1rem;
  }

  .mira-search-panel__search-input {
    background: transparent;
    border: 0;
    flex: 1 1 auto;
    height: 100%;
    min-width: 0;
    padding-inline-start: 0.375rem;
    padding-inline-end: 0.25rem;
    width: auto;
  }

  .mira-search-panel__input::placeholder {
    color: var(
      --mira-code-editor-search-muted,
      var(--text-muted, var(--mira-muted-foreground))
    );
  }

  .mira-search-panel__input:not(.mira-search-panel__search-input):hover,
  .mira-search-panel__search-field:hover {
    border-color: var(
      --mira-code-editor-search-input-hover-border,
      var(--background-modifier-border-hover, var(--mira-border-strong))
    );
  }

  .mira-search-panel__input:not(.mira-search-panel__search-input):focus-visible,
  .mira-search-panel__search-field:focus-within,
  .mira-search-panel__button:focus-visible {
    border-color: transparent;
    box-shadow: 0 0 0 2px
      color-mix(
        in srgb,
        var(
            --mira-code-editor-search-focus-ring,
            var(
              --mira-code-editor-focus-ring,
              var(--interactive-accent, var(--mira-accent))
            )
          )
          30%,
        transparent
      );
    outline: none;
  }

  .mira-search-panel__search-input:focus-visible {
    box-shadow: none;
    outline: none;
  }

  .mira-search-panel__search-field--invalid {
    border-color: rgb(var(--mira-callout-error, 220, 38, 38));
  }

  .mira-search-panel__button {
    align-items: center;
    background: var(--mira-code-editor-search-button-background, transparent);
    border: 1px solid var(--mira-code-editor-search-button-border, transparent);
    border-radius: var(
      --mira-code-editor-radius,
      var(--radius-s, var(--mira-radius))
    );
    color: var(
      --mira-code-editor-search-button-foreground,
      var(
        --mira-code-editor-search-muted,
        var(--text-muted, var(--mira-muted-foreground))
      )
    );
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
    background: var(
      --mira-code-editor-search-button-hover-background,
      var(
        --mira-code-editor-active-line,
        var(--background-modifier-hover, var(--mira-accent-soft))
      )
    );
    border-color: var(
      --mira-code-editor-search-button-hover-border,
      transparent
    );
    color: var(
      --mira-code-editor-search-button-hover-foreground,
      var(
        --mira-code-editor-foreground,
        var(--text-normal, var(--mira-foreground))
      )
    );
  }

  .mira-search-panel__toggle {
    border-color: transparent;
    border-radius: 0.375rem;
    height: 1.5rem;
    width: 1.5rem;
  }

  .mira-search-panel__toggle--active {
    background: var(
      --mira-code-editor-search-active-background,
      var(
        --mira-code-editor-active-line,
        var(--background-modifier-hover, var(--mira-accent-soft))
      )
    );
    border-color: transparent;
    box-shadow: none;
  }

  :global(.cm-panels-top:has(.mira-search-panel-host)) {
    background: transparent;
    border-bottom: 0;
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

    .mira-search-panel__body {
      align-items: flex-start;
    }

    .mira-search-panel__row {
      flex-wrap: wrap;
    }

    .mira-search-panel__search-field,
    .mira-search-panel__replace-row .mira-search-panel__input {
      flex: 1 1 100%;
      width: 100%;
    }

    .mira-search-panel__replace-row {
      padding-right: 0;
    }
  }
</style>
