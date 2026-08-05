<script lang="ts">
  import type { Snippet } from "svelte";
  import type { MiraResolvedListCallout } from "@lapismd/mira/extensions";
  import Icon from "./icon.svelte";
  import ListCalloutControl from "./list-callout-control.svelte";
  import { useMarkdownContext } from "../renderer/context.svelte";

  type Props = {
    "data-callout-char"?: string;
    "data-callout-icon"?: string;
    "data-offset"?: number | string;
    "data-offset-end"?: number | string;
    children?: Snippet;
    class?: string;
    ref?: HTMLSpanElement | null;
    [key: string]: unknown;
  };

  let {
    "data-callout-char": char = "",
    "data-callout-icon": icon,
    "data-offset": offsetFrom,
    "data-offset-end": offsetTo,
    children,
    class: className = "",
    ref = $bindable(null),
    ...props
  }: Props = $props();

  const markdown = useMarkdownContext();
  const callout = $derived(
    markdown.listCallouts.find((candidate) => candidate.char === char),
  );
  const markerFrom = $derived(numericProperty(offsetFrom));
  const markerTo = $derived(numericProperty(offsetTo));
  const editable = $derived(
    Boolean(
      markdown.onChange && callout && markerFrom >= 0 && markerTo > markerFrom,
    ),
  );

  function numericProperty(value: number | string | undefined): number {
    if (typeof value === "number") return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : -1;
  }

  function applyCallout(char: string | null): void {
    let to = markerTo;
    if (char === null && /\s/u.test(markdown.markdown[to] ?? "")) {
      to += 1;
    }
    markdown.onChange?.(char ?? "", markerFrom, to);
  }

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

{#if editable && callout}
  <ListCalloutControl
    {callout}
    callouts={markdown.listCallouts}
    onCalloutChange={applyCallout}
  />
{:else}
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
{/if}
