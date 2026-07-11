<script lang="ts">
  import type { MiraFileRef } from "@mira-mde/extensions";
  import { useMarkdownContext } from "../renderer/context.svelte";
  import { isImageDataUri } from "../remark";

  type Props = {
    src?: string;
    alt?: string;
    title?: string;
    ref?: HTMLImageElement | null;
  };

  let { src = "", alt = "", title, ref = $bindable(null) }: Props = $props();
  const markdown = useMarkdownContext();
  let adapterSrc = $state<string | null>(null);
  const resolvedSrc = $derived(
    adapterSrc ??
      (isImageDataUri(src)
        ? src
        : (markdown.assetResolver?.({
            src,
            alt,
            sourcePath: markdown.sourcePath,
          }) ?? src)),
  );

  $effect(() => {
    const adapter = markdown.fileAdapter;
    if (!adapter || !src || isExternalSrc(src)) {
      adapterSrc = null;
      return;
    }

    let cancelled = false;
    Promise.resolve(
      adapter.resolveLink({
        href: src,
        sourcePath: markdown.sourcePath,
      }),
    )
      .then((file: MiraFileRef | null) => {
        if (!file || !adapter.readAssetUrl) {
          return null;
        }
        return adapter.readAssetUrl(file);
      })
      .then(
        (url) => {
          if (!cancelled) {
            adapterSrc = url ?? null;
          }
        },
        () => {
          if (!cancelled) {
            adapterSrc = null;
          }
        },
      );

    return () => {
      cancelled = true;
    };
  });

  function isExternalSrc(value: string): boolean {
    return /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value.trim());
  }
</script>

<img bind:this={ref} src={resolvedSrc} {alt} {title} />
