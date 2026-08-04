<script lang="ts">
  import CheckIcon from "@lucide/svelte/icons/check";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import {
    miraTaskStates,
    normalizeMiraTaskMarker,
  } from "../../internal/task-states.js";
  import * as Popover from "../../ui/popover/index.js";

  type Props = {
    checkboxClass?: string;
    checked?: boolean;
    disabled?: boolean;
    ref?: HTMLInputElement | null;
    task: string;
    onCheckedChange?: (checked: boolean) => void;
    onTaskChange?: (task: string) => void;
    [key: string]: unknown;
  };

  let {
    checkboxClass = "",
    checked = false,
    disabled = false,
    ref = $bindable(null),
    task,
    onCheckedChange,
    onTaskChange,
    ...inputProps
  }: Props = $props();

  let open = $state(false);
  const normalizedTask = $derived(normalizeMiraTaskMarker(task));

  function chooseTask(marker: string): void {
    const shouldChange = marker !== normalizedTask;
    const changeTask = onTaskChange;
    open = false;
    if (shouldChange) {
      queueMicrotask(() => changeTask?.(marker));
    }
  }
</script>

<input
  bind:this={ref}
  {...inputProps}
  class={`task-list-item-checkbox ${checkboxClass}`.trim()}
  type="checkbox"
  aria-label="Toggle task"
  data-task={task}
  {checked}
  {disabled}
  onchange={(event) =>
    onCheckedChange?.((event.currentTarget as HTMLInputElement).checked)}
/>

{#if !disabled && onTaskChange}
  <Popover.Root bind:open>
    <Popover.Trigger
      class="mira-task-state-trigger"
      aria-label="Change task type"
      title="Change task type"
      data-editable-markdown-ignore-click
    >
      <ChevronDownIcon aria-hidden="true" />
    </Popover.Trigger>
    <Popover.Content
      class="mira-task-state-menu"
      align="start"
      side="bottom"
      sideOffset={6}
      aria-label="Task type"
    >
      <div
        class="mira-task-state-menu__grid"
        role="radiogroup"
        aria-label="Task type"
      >
        {#each miraTaskStates as state (state.marker)}
          <div
            class="mira-task-state-option"
            data-selected={state.marker === normalizedTask ? "true" : undefined}
          >
            <input
              class="mira-task-state-option__checkbox"
              type="checkbox"
              tabindex="-1"
              aria-hidden="true"
              data-task={state.marker}
              checked={state.marker.trim().length > 0}
            />
            <span class="mira-task-state-option__label">{state.label}</span>
            {#if state.marker === normalizedTask}
              <CheckIcon
                class="mira-task-state-option__selected"
                aria-hidden="true"
              />
            {/if}
            <button
              class="mira-task-state-option__action"
              type="button"
              role="radio"
              aria-checked={state.marker === normalizedTask}
              aria-label={state.label}
              onclick={() => chooseTask(state.marker)}
            ></button>
          </div>
        {/each}
      </div>
    </Popover.Content>
  </Popover.Root>
{/if}
