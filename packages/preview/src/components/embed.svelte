<script lang="ts">
  import type { Snippet } from "svelte";

  type Props = {
    href?: string;
    label?: string;
    children?: Snippet;
    ref?: HTMLElement | null;
  };

  let {
    href = "",
    label = href,
    children,
    ref = $bindable(null),
  }: Props = $props();
</script>

<figure bind:this={ref} class="mira-embed" data-embed={href}>
  <figcaption>{label}</figcaption>
  {@render children?.()}
</figure>
