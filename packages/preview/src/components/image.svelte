<script lang="ts">
  import { parseMiraFileTarget, type MiraFileRef } from "@mira-mde/extensions";
  import XIcon from "@lucide/svelte/icons/x";
  import { useMarkdownContext } from "../renderer/context.svelte";
  import { isImageDataUri } from "../remark";
  import { parseMiraImageDetails } from "../embed-target";

  type Props = {
    src?: string;
    alt?: string;
    title?: string;
    ref?: HTMLImageElement | null;
  };

  let { src = "", alt = "", title, ref = $bindable(null) }: Props = $props();
  const markdown = useMarkdownContext();
  let adapterSrc = $state<string | null>(null);
  let resolvedFile = $state<MiraFileRef | null>(null);
  let dialogEl = $state<HTMLDialogElement | null>(null);
  let failed = $state(false);
  let targetRevision = $state(0);
  let contentRevision = $state(0);

  const target = $derived(parseMiraFileTarget(src, markdown.sourcePath));
  const imageDetails = $derived(parseMiraImageDetails(alt));
  const resolvedAlt = $derived(imageDetails.alt);

  const resolvedSrc = $derived(
    adapterSrc ??
      (isImageDataUri(src)
        ? src
        : (markdown.assetResolver?.({
            src,
            alt: resolvedAlt,
            sourcePath: markdown.sourcePath,
          }) ?? src)),
  );

  const trimmedAlt = $derived(resolvedAlt.trim());
  const expandLabel = $derived(
    trimmedAlt ? `Expand image: ${trimmedAlt}` : "Expand image",
  );
  const dialogLabel = $derived(
    trimmedAlt ? `Image preview: ${trimmedAlt}` : "Image preview",
  );

  $effect(() => {
    const adapter = markdown.fileAdapter;
    targetRevision;
    if (!adapter || !src || isExternalSrc(src)) {
      adapterSrc = null;
      resolvedFile = null;
      return;
    }

    let cancelled = false;
    adapterSrc = null;
    resolvedFile = null;
    Promise.resolve(
      adapter.resolveLink({
        ...target,
      }),
    ).then(
      (file: MiraFileRef | null) => {
        if (!cancelled) {
          resolvedFile = file;
        }
      },
      () => {
        if (!cancelled) {
          resolvedFile = null;
          adapterSrc = null;
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
    if (!adapter?.watchTarget || !src || isExternalSrc(src)) {
      return;
    }
    return adapter.watchTarget({ ...target, file }, () => {
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
    contentRevision;
    if (resolvedFile && markdown.fileAdapter?.readAssetUrl) {
      let cancelled = false;
      Promise.resolve(markdown.fileAdapter.readAssetUrl(resolvedFile)).then(
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
    }
  });

  $effect(() => {
    resolvedSrc;
    failed = false;
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

<span
  class="mira-markdown-image-root"
  data-image-state={failed ? "broken" : "ready"}
>
  {#if failed}
    <span
      class="mira-markdown-image__placeholder"
      data-image-placeholder="broken"
      role="img"
      aria-label={trimmedAlt || "Image unavailable"}
      title={src}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 64 48"
        class="mira-markdown-image__placeholder-icon"
        fill="none"
      >
        <rect x="2" y="2" width="60" height="44" rx="8" />
        <path d="M14 34 24 24l8 7 8-9 10 12" />
        <circle cx="23" cy="17" r="4" />
        <path d="M39 14h11M44.5 9.5v10" />
      </svg>
      <span class="mira-markdown-image__placeholder-copy">
        <span class="mira-markdown-image__placeholder-label">
          {trimmedAlt || "Image unavailable"}
        </span>
        <span class="mira-markdown-image__placeholder-source">{src}</span>
      </span>
    </span>
  {:else}
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
        alt={resolvedAlt}
        {title}
        width={imageDetails.width}
        height={imageDetails.height}
        loading="lazy"
        onerror={() => {
          failed = true;
        }}
      />
    </button>
  {/if}

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
          alt={resolvedAlt}
          {title}
          width={imageDetails.width}
          height={imageDetails.height}
        />
        {#if trimmedAlt}
          <figcaption class="mira-markdown-image__dialog-caption">
            {resolvedAlt}
          </figcaption>
        {/if}
      </figure>
    </div>
  </dialog>
</span>
