<script lang="ts">
  import type { Snippet } from "svelte";
  import type { MiraResolvedListCallout } from "@mira-mde/extensions";
  import Icon from "./icon.svelte";
  import { useMarkdownContext } from "../renderer/context.svelte";

  type Props = {
    "data-callout-char"?: string;
    "data-callout-icon"?: string;
    children?: Snippet;
    class?: string;
    ref?: HTMLSpanElement | null;
    [key: string]: unknown;
  };

  let {
    "data-callout-char": char = "",
    "data-callout-icon": icon,
    children,
    class: className = "",
    ref = $bindable(null),
    ...props
  }: Props = $props();

  const markdown = useMarkdownContext();
  const callout = $derived(
    markdown.listCallouts.find((candidate) => candidate.char === char),
  );

  function renderCustomMarker(
    element: HTMLSpanElement,
    activeCallout?: MiraResolvedListCallout,
  ) {
    let cleanup: (() => void) | void;

    function render(nextCallout?: MiraResolvedListCallout): void {
      cleanup?.();
      cleanup = undefined;
      if (nextCallout?.renderMarker) {
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

<span
  bind:this={ref}
  use:renderCustomMarker={callout}
  {...props}
  class={`lc-list-marker ${className}`.trim()}
  data-list-callout-marker="true"
  data-callout-char={char}
  data-callout-icon={icon}
  aria-hidden="true"
>
  {#if !callout?.renderMarker}
    {#if icon}
      <Icon name={icon} />
    {:else if char}
      {char}
    {:else}
      {@render children?.()}
    {/if}
  {/if}
</span>
