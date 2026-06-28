<script lang="ts">
  import type { Snippet } from "svelte";
  import type { MiraFileRef } from "@mira-mde/extensions";
  import { useMarkdownContext } from "../renderer/context.svelte";
  import EmbeddedMarkdownPreview from "./embedded-markdown-preview.svelte";

  type Props = {
    href?: string;
    id?: string;
    label?: string;
    text?: string;
    sourcePath?: string;
    children?: Snippet;
    ref?: HTMLElement | null;
  };

  let {
    href = "",
    id,
    label = href,
    text,
    sourcePath,
    children,
    ref = $bindable(null),
  }: Props = $props();
  const markdown = useMarkdownContext();

  let embedHost: HTMLDivElement | null = $state(null);
  let resolvedFile = $state<MiraFileRef | null>(null);
  let previewMarkdown = $state<string | null>(null);
  let previewAssetUrl = $state<string | null>(null);
  let customRendered = $state(false);

  const target = $derived(id || href);
  const displayText = $derived(text || label || target);
  const activeSourcePath = $derived(sourcePath || markdown.sourcePath);

  $effect(() => {
    const adapter = markdown.fileAdapter;
    const currentTarget = target;
    if (!adapter || !currentTarget) {
      resolvedFile = null;
      return;
    }

    let cancelled = false;
    Promise.resolve(
      adapter.resolveLink({
        href: currentTarget,
        sourcePath: activeSourcePath,
      }),
    ).then(
      (file) => {
        if (!cancelled) {
          resolvedFile = file;
        }
      },
      () => {
        if (!cancelled) {
          resolvedFile = null;
        }
      },
    );

    return () => {
      cancelled = true;
    };
  });

  $effect(() => {
    const adapter = markdown.fileAdapter;
    const file = resolvedFile;
    const host = embedHost;
    customRendered = false;

    if (!adapter || !file || !host || !adapter.renderEmbed) {
      return;
    }

    host.replaceChildren();
    const cleanup = adapter.renderEmbed(
      { file, label: displayText, sourcePath: activeSourcePath },
      host,
    );
    customRendered = true;

    return () => {
      cleanup?.();
      host.replaceChildren();
    };
  });

  $effect(() => {
    const adapter = markdown.fileAdapter;
    const file = resolvedFile;
    previewMarkdown = null;
    previewAssetUrl = null;

    if (!adapter || !file || customRendered) {
      return;
    }

    let cancelled = false;
    Promise.all([
      adapter.readMarkdown ? Promise.resolve(adapter.readMarkdown(file)) : null,
      adapter.readAssetUrl ? Promise.resolve(adapter.readAssetUrl(file)) : null,
    ]).then(
      ([nextMarkdown, nextAssetUrl]) => {
        if (!cancelled) {
          previewMarkdown = nextMarkdown;
          previewAssetUrl = nextAssetUrl;
        }
      },
      () => {
        if (!cancelled) {
          previewMarkdown = null;
          previewAssetUrl = null;
        }
      },
    );

    return () => {
      cancelled = true;
    };
  });
</script>

<figure
  bind:this={ref}
  class="mira-embed internal-embed"
  data-embed={target}
  data-embed-state={resolvedFile ? "resolved" : "unresolved"}
>
  <figcaption>{displayText}</figcaption>
  <div bind:this={embedHost} class="mira-embed__content">
    {#if !customRendered}
      {#if previewAssetUrl}
        <img src={previewAssetUrl} alt={displayText} />
      {:else if previewMarkdown}
        <EmbeddedMarkdownPreview
          class="mira-embed__markdown"
          value={previewMarkdown}
          sourcePath={resolvedFile?.path}
        />
      {:else if children}
        {@render children()}
      {:else if !resolvedFile}
        <span class="mira-embed__missing">{target}</span>
      {/if}
    {/if}
  </div>
</figure>
