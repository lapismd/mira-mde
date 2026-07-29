<script lang="ts">
  import type { Snippet } from "svelte";
  import { parseMiraFileTarget, type MiraFileRef } from "@mira-mde/extensions";
  import { useMarkdownContext } from "../renderer/context.svelte";
  import EmbeddedMarkdownPreview from "./embedded-markdown-preview.svelte";

  type Props = {
    href?: string;
    id?: string;
    label?: string;
    text?: string;
    title?: string;
    class?: string;
    sourcePath?: string;
    children?: Snippet;
    ref?: HTMLElement | null;
  };

  let {
    href = "",
    id,
    label = href,
    text,
    title,
    class: className = "",
    sourcePath,
    children,
    ref = $bindable(null),
  }: Props = $props();
  const markdown = useMarkdownContext();

  let resolvedFile = $state<MiraFileRef | null>(null);
  let previewMarkdown = $state<string | null>(null);
  let previewAssetUrl = $state<string | null>(null);
  let targetRevision = $state(0);

  const target = $derived(id || href);
  const displayText = $derived(text || label || target);
  const activeSourcePath = $derived(sourcePath || markdown.sourcePath);
  const parsedTarget = $derived(parseMiraFileTarget(target, activeSourcePath));
  const hasFileAdapter = $derived(Boolean(markdown.fileAdapter));
  const isExternal = $derived(isExternalHref(target));
  const resolvedHref = $derived(
    markdown.linkResolver?.({
      href: target,
      label: displayText,
      sourcePath: activeSourcePath,
    }) ?? target,
  );

  $effect(() => {
    const adapter = markdown.fileAdapter;
    const currentTarget = target;
    targetRevision;
    if (!adapter || !currentTarget || isExternalHref(currentTarget)) {
      resolvedFile = null;
      previewMarkdown = null;
      previewAssetUrl = null;
      return;
    }

    let cancelled = false;
    Promise.resolve(
      adapter.resolveLink({
        ...parsedTarget,
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
    if (
      !adapter?.watchTarget ||
      !parsedTarget.href ||
      isExternalHref(parsedTarget.href)
    ) {
      return;
    }
    return adapter.watchTarget({ ...parsedTarget, file }, () => {
      targetRevision += 1;
    });
  });

  $effect(() => {
    const adapter = markdown.fileAdapter;
    const file = resolvedFile;
    previewMarkdown = null;
    previewAssetUrl = null;

    if (!adapter || !file) {
      return;
    }

    let cancelled = false;
    const markdownPromise = adapter.readMarkdown
      ? Promise.resolve(adapter.readMarkdown(file))
      : Promise.resolve(null);
    const assetPromise = adapter.readAssetUrl
      ? Promise.resolve(adapter.readAssetUrl(file))
      : Promise.resolve(null);

    Promise.all([markdownPromise, assetPromise]).then(
      ([nextMarkdown, nextAssetUrl]) => {
        if (cancelled) {
          return;
        }
        previewMarkdown = nextMarkdown;
        previewAssetUrl = nextAssetUrl;
      },
      () => {
        if (!cancelled) {
          previewMarkdown = null;
          previewAssetUrl = null;
        }
      },
    );

    const stopWatching = adapter.watchFile?.(file, () => {
      resolvedFile = { ...file };
    });

    return () => {
      cancelled = true;
      stopWatching?.();
    };
  });

  function openInternalLink(event: MouseEvent): void {
    if (!resolvedFile || !markdown.fileAdapter?.openFile) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    event.preventDefault();
    void markdown.fileAdapter.openFile(resolvedFile, event);
  }

  function stopUnresolvedLinkInteraction(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  function isExternalHref(value: string): boolean {
    return /^((https?|ftps?|ssh):)?\/\//i.test(value.trim());
  }
</script>

{#if hasFileAdapter && !isExternal}
  <span
    class={`mira-link-preview ${className}`.trim()}
    data-link-preview-state={resolvedFile ? "resolved" : "unresolved"}
    data-link-preview-path={target}
  >
    <button
      bind:this={ref}
      type="button"
      class="mira-link-preview__trigger"
      data-link-preview-trigger
      data-link-preview-state={resolvedFile ? "resolved" : "unresolved"}
      data-link-preview-path={target}
      data-mira-internal-link="true"
      data-invalid={resolvedFile ? undefined : "true"}
      {title}
      onclick={resolvedFile ? openInternalLink : stopUnresolvedLinkInteraction}
      onmousedown={resolvedFile ? undefined : stopUnresolvedLinkInteraction}
    >
      {#if children}
        {@render children()}
      {:else}
        {displayText}
      {/if}
    </button>
    <span class="mira-link-preview__card" role="tooltip">
      {#if resolvedFile}
        <span class="mira-link-preview__title">
          {resolvedFile.name || displayText}
        </span>
        <span class="mira-link-preview__path">{resolvedFile.path}</span>
        {#if previewAssetUrl}
          <img
            class="mira-link-preview__asset"
            src={previewAssetUrl}
            alt={resolvedFile.name || displayText}
          />
        {:else if previewMarkdown}
          <EmbeddedMarkdownPreview
            class="mira-link-preview__markdown"
            value={previewMarkdown}
            sourcePath={resolvedFile.path}
          />
        {:else}
          <span class="mira-link-preview__empty">No preview available</span>
        {/if}
      {:else}
        <span class="mira-link-preview__title">Unresolved link</span>
        <span class="mira-link-preview__path">{target}</span>
      {/if}
    </span>
  </span>
{:else}
  <a
    bind:this={ref}
    class={className || undefined}
    href={resolvedHref}
    {title}
    data-mira-internal-link={isExternal ? undefined : "true"}
  >
    {#if children}
      {@render children()}
    {:else}
      {displayText}
    {/if}
  </a>
{/if}
