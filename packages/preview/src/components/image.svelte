<script lang="ts">
  import type { MiraFileRef } from "@mira-mde/extensions";
  import XIcon from "@lucide/svelte/icons/x";
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
  let dialogEl = $state<HTMLDialogElement | null>(null);

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

  const trimmedAlt = $derived(alt.trim());
  const expandLabel = $derived(
    trimmedAlt ? `Expand image: ${trimmedAlt}` : "Expand image",
  );
  const dialogLabel = $derived(
    trimmedAlt ? `Image preview: ${trimmedAlt}` : "Image preview",
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

  // Native <dialog> renders in the browser's top layer, so its DOM position
  // doesn't affect stacking or visibility. Portalling to <body> keeps it out
  // of inline markdown content (images can render inside a <p>), where a
  // <dialog> element would otherwise be an invalid child.
  function portalToBody(node: HTMLElement) {
    if (typeof document === "undefined") {
      return {};
    }
    document.body.appendChild(node);
    return {
      destroy() {
        node.remove();
      },
    };
  }

  function openLightbox(): void {
    if (!resolvedSrc) {
      return;
    }
    dialogEl?.showModal();
  }

  function closeLightbox(): void {
    dialogEl?.close();
  }

  function handleDialogClick(event: MouseEvent): void {
    if (event.target === dialogEl) {
      closeLightbox();
    }
  }
</script>

<span class="mira-markdown-image-root">
  <button
    type="button"
    class="mira-markdown-image__trigger"
    onclick={openLightbox}
    aria-label={expandLabel}
    aria-haspopup="dialog"
    title={expandLabel}
  >
    <img
      bind:this={ref}
      class="mira-markdown-image"
      src={resolvedSrc}
      {alt}
      {title}
      loading="lazy"
    />
  </button>

  <dialog
    bind:this={dialogEl}
    class="mira-markdown-image__dialog"
    aria-label={dialogLabel}
    use:portalToBody
    onclick={handleDialogClick}
  >
    <div class="mira-markdown-image__dialog-inner">
      <div class="mira-markdown-image__dialog-header">
        <button
          type="button"
          class="mira-markdown-image__dialog-close"
          onclick={closeLightbox}
          aria-label="Close image preview"
          title="Close image preview"
        >
          <XIcon
            class="mira-markdown-image__dialog-close-icon"
            aria-hidden="true"
          />
        </button>
      </div>
      <figure class="mira-markdown-image__dialog-figure">
        <img
          class="mira-markdown-image__dialog-img"
          src={resolvedSrc}
          {alt}
          {title}
        />
        {#if trimmedAlt}
          <figcaption class="mira-markdown-image__dialog-caption">
            {alt}
          </figcaption>
        {/if}
      </figure>
    </div>
  </dialog>
</span>
