<script lang="ts">
  import type { Snippet } from "svelte";

  type Props = {
    type?: string;
    title?: string;
    children?: Snippet;
    ref?: HTMLElement | null;
  };

  let {
    type = "note",
    title = type,
    children,
    ref = $bindable(null),
  }: Props = $props();
</script>

<aside bind:this={ref} class="mira-callout" data-callout={type}>
  <div class="mira-callout__title">{title}</div>
  <div class="mira-callout__content">
    {@render children?.()}
  </div>
</aside>
