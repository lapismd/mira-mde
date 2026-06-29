<script lang="ts">
  import CheckIcon from "@lucide/svelte/icons/check";
  import CopyIcon from "@lucide/svelte/icons/copy";
  import type { Snippet } from "svelte";

  type Props = {
    children?: Snippet;
    class?: string;
    code?: string;
    ref?: HTMLElement | null;
    [key: string]: unknown;
  };

  let {
    children,
    ref = $bindable(null),
    class: className = "",
    code: content = "",
    ...restProps
  }: Props = $props();

  const block = $derived(className.includes("hljs") || content.includes("\n"));
  const textCodeBlock = $derived(
    /(?:^|\s)language-text(?:\s|$)/u.test(className),
  );
  let copied = $state(false);
  let copyTimer: ReturnType<typeof setTimeout> | undefined;

  function classNames(...values: Array<string | false | undefined>): string {
    return values.filter(Boolean).join(" ");
  }

  function fitTextCodeBlockToLivePreviewViewport(
    el: HTMLElement,
    enabled: boolean,
  ) {
    let active = enabled;
    let resizeObserver: ResizeObserver | null = null;

    const update = () => {
      if (!active) {
        el.style.maxWidth = "";
        return;
      }

      const editor = el.closest(".cm-editor.markdown-live-preview-view");
      const scroller = editor?.querySelector(":scope > .cm-scroller");
      if (!(scroller instanceof HTMLElement)) {
        el.style.maxWidth = "";
        return;
      }

      const scrollerRect = scroller.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const maxWidth = Math.max(0, scrollerRect.right - elRect.left);
      el.style.maxWidth = `${maxWidth}px`;
    };

    queueMicrotask(update);
    resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);
    const editor = el.closest(".cm-editor.markdown-live-preview-view");
    const scroller = editor?.querySelector(":scope > .cm-scroller");
    if (scroller instanceof HTMLElement) {
      resizeObserver.observe(scroller);
    }
    window.addEventListener("resize", update);

    return {
      update(value: boolean) {
        active = value;
        update();
      },
      destroy() {
        resizeObserver?.disconnect();
        window.removeEventListener("resize", update);
      },
    };
  }

  async function copyCode(): Promise<void> {
    await navigator.clipboard.writeText(content);
    copied = true;
    if (copyTimer) {
      clearTimeout(copyTimer);
    }
    copyTimer = setTimeout(() => {
      copied = false;
    }, 1200);
  }
</script>

{#if block}
  <div
    bind:this={ref}
    use:fitTextCodeBlockToLivePreviewViewport={textCodeBlock}
    class={classNames(
      "mira-code-block",
      "group relative flex rounded-sm px-4 py-4 font-mono whitespace-pre",
      textCodeBlock
        ? "markdown-text-code-block max-w-full items-start overflow-x-auto overflow-y-hidden"
        : "items-center",
    )}
  >
    <code
      class={classNames(
        "text-sm",
        textCodeBlock && "min-w-max !whitespace-pre",
        className,
      )}
      {...restProps}
    >
      {@render children?.()}
    </code>
    {#if content}
      <div class="mira-code-block__copy absolute end-2 top-2">
        <button
          type="button"
          class="mira-code-block__copy-button text-muted-foreground bg-secondary inline-flex items-center justify-center rounded-sm"
          aria-label={copied ? "Copied" : "Copy code"}
          title={copied ? "Copied" : "Copy code"}
          onclick={() => void copyCode()}
        >
          {#if copied}
            <CheckIcon class="mira-code-block__copy-icon" aria-hidden="true" />
          {:else}
            <CopyIcon class="mira-code-block__copy-icon" aria-hidden="true" />
          {/if}
        </button>
      </div>
    {/if}
  </div>
{:else}
  <code
    bind:this={ref}
    class={classNames("font-mono text-sm whitespace-pre", className)}
    {...restProps}
  >
    {@render children?.()}
  </code>
{/if}
