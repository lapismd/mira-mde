<script lang="ts">
  import type { Snippet } from "svelte";
  import { useMarkdownContext } from "../renderer/context.svelte";

  type Props = {
    href?: string;
    label?: string;
    title?: string;
    children?: Snippet;
    ref?: HTMLAnchorElement | null;
  };

  let {
    href = "",
    label = href,
    title,
    children,
    ref = $bindable(null),
  }: Props = $props();
  const markdown = useMarkdownContext();
  const resolvedHref = $derived(
    markdown.linkResolver?.({
      href,
      label,
      sourcePath: markdown.sourcePath,
    }) ?? href,
  );
</script>

<a
  bind:this={ref}
  href={resolvedHref}
  {title}
  data-mira-internal-link={href.startsWith("http") ? undefined : "true"}
>
  {@render children?.()}
</a>
