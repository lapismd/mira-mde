<script lang="ts">
  import type { Snippet } from "svelte";
  import {
    parseMiraFileTarget,
    type MiraFileRef,
  } from "@lapismd/mira/extensions";
  import { useMarkdownContext } from "../renderer/context.svelte";
  import {
    parseMiraImageDetails,
    selectMarkdownEmbedFragment,
  } from "../embed-target";
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
  let fragmentMissing = $state(false);
  let targetRevision = $state(0);
  let contentRevision = $state(0);

  const target = $derived(id || href);
  const activeSourcePath = $derived(sourcePath || markdown.sourcePath);
  const parsedTarget = $derived(parseMiraFileTarget(target, activeSourcePath));
  const imageDetails = $derived(
    parseMiraImageDetails(
      text || label,
      resolvedFile?.name || parsedTarget.path || target,
    ),
  );
  const displayText = $derived(
    imageDetails.width
      ? imageDetails.alt
      : text || label || resolvedFile?.name || parsedTarget.path || target,
  );

  $effect(() => {
    const adapter = markdown.fileAdapter;
    const currentTarget = parsedTarget;
    targetRevision;
    if (!adapter || !currentTarget) {
      resolvedFile = null;
      return;
    }

    let cancelled = false;
    Promise.resolve(
      adapter.resolveLink({
        ...currentTarget,
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
    const currentTarget = parsedTarget;
    const file = resolvedFile;
    if (!adapter?.watchTarget || !currentTarget.href) {
      return;
    }
    return adapter.watchTarget({ ...currentTarget, file }, () => {
      targetRevision += 1;
    });
  });

  $effect(() => {
    const adapter = markdown.fileAdapter;
    const file = resolvedFile;
    if (!adapter?.watchFile || !file) {
      return;
    }
    return adapter.watchFile(file, () => {
      contentRevision += 1;
    });
  });

  $effect(() => {
    const adapter = markdown.fileAdapter;
    const file = resolvedFile;
    const host = embedHost;
    customRendered = false;

    if (
      !adapter ||
      !file ||
      !host ||
      !adapter.renderEmbed ||
      parsedTarget.fragment
    ) {
      return;
    }

    host.replaceChildren();
    const cleanup = adapter.renderEmbed(
      {
        ...parsedTarget,
        file,
        label: displayText,
        width: imageDetails.width,
        height: imageDetails.height,
      },
      host,
    );
    if (cleanup === false) {
      return;
    }
    customRendered = true;

    return () => {
      cleanup?.();
      host.replaceChildren();
    };
  });

  $effect(() => {
    const adapter = markdown.fileAdapter;
    const file = resolvedFile;
    contentRevision;
    previewMarkdown = null;
    previewAssetUrl = null;
    fragmentMissing = false;

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
          if (nextMarkdown !== null) {
            const selection = selectMarkdownEmbedFragment(
              nextMarkdown,
              parsedTarget.fragment,
            );
            previewMarkdown = selection.found ? selection.markdown : null;
            fragmentMissing = !selection.found;
          }
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
  data-embed-fragment={parsedTarget.fragment?.kind}
>
  <figcaption>{displayText}</figcaption>
  <div class="mira-embed__content">
    <div
      bind:this={embedHost}
      class="mira-embed__custom"
      hidden={!customRendered}
    ></div>
    {#if !customRendered}
      {#if previewAssetUrl}
        <img
          src={previewAssetUrl}
          alt={displayText}
          width={imageDetails.width}
          height={imageDetails.height}
        />
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
      {:else if fragmentMissing}
        <span class="mira-embed__missing">
          Unable to find {parsedTarget.fragment?.kind} "{parsedTarget.fragment
            ?.value}" in {resolvedFile.name || resolvedFile.path}.
        </span>
      {/if}
    {/if}
  </div>
</figure>
