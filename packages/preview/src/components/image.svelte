<script lang="ts">
  import { useMarkdownContext } from "../renderer/context.svelte";

  type Props = {
    src?: string;
    alt?: string;
    title?: string;
    ref?: HTMLImageElement | null;
  };

  let { src = "", alt = "", title, ref = $bindable(null) }: Props = $props();
  const markdown = useMarkdownContext();
  const resolvedSrc = $derived(
    markdown.assetResolver?.({ src, alt, sourcePath: markdown.sourcePath }) ??
      src,
  );
</script>

<img bind:this={ref} src={resolvedSrc} {alt} {title} />
