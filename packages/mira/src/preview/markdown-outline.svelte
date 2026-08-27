<script lang="ts">
  import {
    activeMarkdownOutlineId,
    findMarkdownOutlineScrollRoot,
    slugHeadingText,
    type MarkdownOutlineItem,
    type MarkdownOutlineVariant,
  } from "./outline";

  type Props = {
    value: string;
    headingIdPrefix?: string;
    minLevel?: number;
    maxLevel?: number;
    variant?: MarkdownOutlineVariant;
    title?: string;
    root?: HTMLElement | null;
    class?: string;
  };

  let {
    value,
    headingIdPrefix = "",
    minLevel = 1,
    maxLevel = 6,
    variant = "floating",
    title = "On this page",
    root = null,
    class: className = "",
  }: Props = $props();

  let activeId = $state("");
  let hoverOpen = $state(false);
  let pinnedOpen = $state(false);
  let focusOpen = $state(false);
  let containerElement = $state<HTMLDivElement | null>(null);

  const items = $derived(
    extractOutline(value, {
      headingIdPrefix,
      minLevel,
      maxLevel,
    }),
  );
  const isOpen = $derived(
    variant === "floating" && (hoverOpen || pinnedOpen || focusOpen),
  );

  function extractOutline(
    markdown: string,
    options: {
      headingIdPrefix: string;
      minLevel: number;
      maxLevel: number;
    },
  ): MarkdownOutlineItem[] {
    const counts = new Map<string, number>();
    const headings: MarkdownOutlineItem[] = [];

    for (const line of markdown.split(/\r?\n/)) {
      const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
      if (!match) continue;

      const marker = match[1] ?? "";
      const content = match[2] ?? "";
      const level = marker.length;
      if (level < options.minLevel || level > options.maxLevel) continue;

      const text = content.replace(/[`*_~[\]()]/g, "").trim();
      const slug = `${options.headingIdPrefix}${slugHeadingText(text)}`;
      const count = counts.get(slug) ?? 0;
      counts.set(slug, count + 1);
      headings.push({
        id: count === 0 ? slug : `${slug}-${count}`,
        level,
        text,
      });
    }

    return headings;
  }

  function headingElement(item: MarkdownOutlineItem): HTMLElement | null {
    if (root) {
      return root.querySelector<HTMLElement>(`[id="${CSS.escape(item.id)}"]`);
    }

    return document.getElementById(item.id);
  }

  function navigateToHeading(item: MarkdownOutlineItem): void {
    const target = headingElement(item);
    if (!target) return;

    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    target.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    activeId = item.id;
  }

  function handleRailClick(event: MouseEvent, item: MarkdownOutlineItem): void {
    event.preventDefault();
    event.stopPropagation();
    pinnedOpen = true;
    navigateToHeading(item);
  }

  function handlePanelClick(
    event: MouseEvent,
    item: MarkdownOutlineItem,
  ): void {
    event.preventDefault();
    event.stopPropagation();
    navigateToHeading(item);
    pinnedOpen = false;
  }

  function handleFocusOut(): void {
    window.setTimeout(() => {
      if (!containerElement?.contains(document.activeElement))
        focusOpen = false;
    }, 0);
  }

  function handleDocumentPointerDown(event: PointerEvent): void {
    const target = event.target;
    if (target instanceof Node && containerElement?.contains(target)) return;
    hoverOpen = false;
    pinnedOpen = false;
    focusOpen = false;
  }

  $effect(() => {
    if (variant !== "floating" || items.length === 0) return;

    const firstTarget = headingElement(items[0]!);
    const scrollRoot = findMarkdownOutlineScrollRoot(firstTarget, root);
    let frame = 0;
    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        activeId = activeMarkdownOutlineId(
          items,
          headingElement,
          scrollRoot,
          96,
          document.activeElement,
        );
      });
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    scrollRoot?.addEventListener("scroll", scheduleUpdate, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      scrollRoot?.removeEventListener("scroll", scheduleUpdate);
    };
  });

  $effect(() => {
    if (!isOpen) return;
    document.addEventListener("pointerdown", handleDocumentPointerDown, true);
    return () => {
      document.removeEventListener(
        "pointerdown",
        handleDocumentPointerDown,
        true,
      );
    };
  });
</script>

{#if items.length > 0}
  {#if variant === "floating"}
    <div
      class={`mira-markdown-outline mira-markdown-outline--floating ${isOpen ? "is-open" : ""} ${className}`.trim()}
      role="group"
      aria-label="Document outline"
      bind:this={containerElement}
      onpointerenter={() => (hoverOpen = true)}
      onpointerleave={() => (hoverOpen = false)}
      onfocusin={() => (focusOpen = true)}
      onfocusout={handleFocusOut}
    >
      <ol
        class="mira-markdown-outline__rail"
        aria-label="Document heading markers"
      >
        {#each items as item (item.id)}
          <li>
            <button
              type="button"
              class="mira-markdown-outline__rail-marker"
              aria-label={`Open outline and scroll to ${item.text}`}
              aria-current={activeId === item.id ? "true" : undefined}
              data-level={item.level}
              onclick={(event) => handleRailClick(event, item)}
            >
              <span
                class={`mira-markdown-outline__rail-line ${activeId === item.id ? "is-active" : ""}`}
                aria-hidden="true"
              ></span>
            </button>
          </li>
        {/each}
      </ol>

      {#if isOpen}
        <nav
          class="mira-markdown-outline__panel"
          aria-label="Table of contents"
        >
          <p class="mira-markdown-outline__title">{title}</p>
          <ol>
            {#each items as item (item.id)}
              <li>
                <button
                  type="button"
                  class={`mira-markdown-outline__item ${activeId === item.id ? "is-active" : ""}`}
                  aria-current={activeId === item.id ? "true" : undefined}
                  data-level={item.level}
                  onclick={(event) => handlePanelClick(event, item)}
                >
                  {item.text}
                </button>
              </li>
            {/each}
          </ol>
        </nav>
      {/if}
    </div>
  {:else}
    <nav
      class={`mira-markdown-outline mira-markdown-outline--sidebar ${className}`.trim()}
      aria-label="Table of contents"
    >
      <ol>
        {#each items as item (item.id)}
          <li style={`--mira-outline-level: ${item.level}`}>
            <a href={`#${item.id}`}>{item.text}</a>
          </li>
        {/each}
      </ol>
    </nav>
  {/if}
{/if}
