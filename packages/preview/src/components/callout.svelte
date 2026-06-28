<script lang="ts">
  import type { Snippet } from "svelte";
  import { useMarkdownContext } from "../renderer/context.svelte";
  import Icon from "./icon.svelte";

  type Props = {
    type?: string;
    title?: string;
    children?: Snippet;
    ref?: HTMLElement | null;
    "data-callout"?: string;
    "data-expand-offset"?: string | number;
    "data-expandable"?: string;
    "data-expanded"?: string;
    "data-icon"?: string;
    "data-type"?: string;
  };

  let {
    type = "note",
    title,
    children,
    ref = $bindable(null),
    "data-callout": dataCallout,
    "data-expand-offset": dataExpandOffset,
    "data-expandable": dataExpandable = "false",
    "data-expanded": dataExpanded = "false",
    "data-icon": dataIcon,
    "data-type": dataType,
  }: Props = $props();

  const markdown = useMarkdownContext();
  const calloutType = $derived((dataType ?? dataCallout ?? type).toLowerCase());
  const expandable = $derived(dataExpandable === "true");
  const heading = $derived(title || defaultTitle(calloutType));
  let open = $state(true);

  $effect(() => {
    open = !expandable || dataExpanded === "true";
  });

  function toggleOpen(): void {
    if (!expandable) {
      return;
    }

    open = !open;
    const offset = toNumber(dataExpandOffset);
    if (offset === null) {
      return;
    }

    markdown.onChange?.(open ? "+" : "-", offset, offset + 1);
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

  function defaultTitle(value: string): string {
    return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
  }
</script>

<aside
  bind:this={ref}
  class={`callout mira-callout callout-${calloutType}`}
  data-callout={calloutType}
  data-expandable={dataExpandable}
>
  {#if expandable}
    <button
      type="button"
      class="callout-title mira-callout__title"
      aria-expanded={open}
      data-editable-markdown-ignore-click
      onclick={toggleOpen}
    >
      <span class="callout-icon mira-callout__icon">
        <Icon name={[`callout-${calloutType}`, dataIcon ?? "info", "info"]} />
      </span>
      <span class="callout-title-inner mira-callout__title-inner">
        {heading}
      </span>
      <span class="callout-fold mira-callout__fold">
        <svg
          class="mira-callout__fold-icon"
          data-open={open}
          aria-hidden="true"
          viewBox="0 0 24 24"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </span>
    </button>
  {:else}
    <div class="callout-title mira-callout__title">
      <span class="callout-icon mira-callout__icon">
        <Icon name={[`callout-${calloutType}`, dataIcon ?? "info", "info"]} />
      </span>
      <span class="callout-title-inner mira-callout__title-inner">
        {heading}
      </span>
    </div>
  {/if}

  {#if open}
    <div class="callout-content mira-callout__content">
      {@render children?.()}
    </div>
  {/if}
</aside>
