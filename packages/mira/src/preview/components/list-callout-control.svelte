<script lang="ts">
  import CheckIcon from "@lucide/svelte/icons/check";
  import XIcon from "@lucide/svelte/icons/x";
  import type { MiraResolvedListCallout } from "@lapismd/mira/extensions";
  import * as Popover from "../../ui/popover/index.js";
  import Icon from "./icon.svelte";

  type Props = {
    callout: MiraResolvedListCallout;
    callouts: readonly MiraResolvedListCallout[];
    onCalloutChange?: (char: string | null) => void;
  };

  let { callout, callouts, onCalloutChange }: Props = $props();
  let open = $state(false);

  function chooseCallout(char: string | null): void {
    const shouldChange = char !== callout.char;
    const changeCallout = onCalloutChange;
    open = false;
    if (shouldChange) {
      queueMicrotask(() => changeCallout?.(char));
    }
  }

  function renderCustomMarker(
    element: HTMLSpanElement,
    activeCallout: MiraResolvedListCallout,
  ) {
    let cleanup: (() => void) | void;

    function render(nextCallout: MiraResolvedListCallout): void {
      cleanup?.();
      cleanup = undefined;
      if (nextCallout.renderMarker) {
        element.replaceChildren();
        cleanup = nextCallout.renderMarker(element, nextCallout);
      }
    }

    render(activeCallout);
    return {
      update: render,
      destroy() {
        cleanup?.();
      },
    };
  }
</script>

<Popover.Root bind:open>
  <Popover.Trigger
    class="lc-list-marker mira-list-callout-trigger"
    aria-label={`Change list highlight (${callout.char})`}
    title="Change list highlight"
    data-callout-char={callout.char}
    data-callout-icon={callout.icon}
    data-editable-markdown-ignore-click
  >
    <span
      class="mira-list-callout-glyph"
      use:renderCustomMarker={callout}
      aria-hidden="true"
    >
      {#if !callout.renderMarker}
        {#if callout.icon}
          <Icon name={callout.icon} />
        {:else}
          {callout.char}
        {/if}
      {/if}
    </span>
  </Popover.Trigger>
  <Popover.Content
    class="mira-list-callout-menu"
    align="start"
    side="bottom"
    sideOffset={6}
    aria-label="List highlight"
  >
    <div
      class="mira-list-callout-menu__grid"
      role="radiogroup"
      aria-label="List highlight"
    >
      {#each callouts as option (option.char)}
        <button
          class="mira-list-callout-option"
          type="button"
          role="radio"
          aria-checked={option.char === callout.char}
          aria-label={`Use ${option.char} list highlight`}
          data-callout-char={option.char}
          data-selected={option.char === callout.char ? "true" : undefined}
          style={`--lc-callout-color: ${option.color}`}
          onclick={() => chooseCallout(option.char)}
        >
          <span
            class="mira-list-callout-option__marker"
            use:renderCustomMarker={option}
            aria-hidden="true"
          >
            {#if !option.renderMarker}
              {#if option.icon}
                <Icon name={option.icon} />
              {:else}
                {option.char}
              {/if}
            {/if}
          </span>
          <code class="mira-list-callout-option__label">{option.char}</code>
          {#if option.char === callout.char}
            <CheckIcon
              class="mira-list-callout-option__selected"
              aria-hidden="true"
            />
          {/if}
        </button>
      {/each}
      <button
        class="mira-list-callout-option mira-list-callout-option--clear"
        type="button"
        role="radio"
        aria-checked="false"
        aria-label="Remove list highlight"
        onclick={() => chooseCallout(null)}
      >
        <span
          class="mira-list-callout-option__marker mira-list-callout-option__marker--clear"
          aria-hidden="true"
        >
          <XIcon />
        </span>
        <span class="mira-list-callout-option__label">No highlight</span>
      </button>
    </div>
  </Popover.Content>
</Popover.Root>
