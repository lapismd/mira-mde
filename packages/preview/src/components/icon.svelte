<script lang="ts">
  type Props = {
    name?: string | string[] | null;
    class?: string;
    ref?: SVGSVGElement | null;
  };

  const iconNames = new Set([
    "at-sign",
    "binary",
    "bookmark",
    "braces",
    "brackets",
    "bug",
    "calendar",
    "check",
    "check-square",
    "chevron-right",
    "circle-check",
    "circle-help",
    "clipboard-list",
    "clock",
    "file-question",
    "flame",
    "info",
    "list",
    "list-tree",
    "pencil",
    "plus",
    "quote",
    "tags",
    "text",
    "triangle-alert",
    "x",
    "zap",
  ]);

  let { name, class: className = "", ref = $bindable(null) }: Props = $props();

  const normalizedName = $derived(
    Array.isArray(name)
      ? (name.find((item) => iconNames.has(normalizeIconName(item))) ?? "info")
      : (name ?? "info"),
  );
  const icon = $derived(normalizeIconName(normalizedName));

  function normalizeIconName(value: string): string {
    return value.replace(/^lucide-/, "").replace(/^callout-/, "");
  }
</script>

<svg
  bind:this={ref}
  class={`mira-icon ${className}`.trim()}
  aria-hidden="true"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  {#if icon === "tags"}
    <path
      d="M13 5h6v6l-7.5 7.5a2 2 0 0 1-2.8 0L5.5 15.3a2 2 0 0 1 0-2.8L13 5Z"
    />
    <path d="M16 8h.01" />
    <path d="M6 6l-4 4 6 6" />
  {:else if icon === "at-sign"}
    <circle cx="12" cy="12" r="4" />
    <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
  {:else if icon === "list"}
    <path d="M8 6h13" />
    <path d="M8 12h13" />
    <path d="M8 18h13" />
    <path d="M3 6h.01" />
    <path d="M3 12h.01" />
    <path d="M3 18h.01" />
  {:else if icon === "list-tree"}
    <path d="M21 12h-8" />
    <path d="M21 6H8" />
    <path d="M21 18h-8" />
    <path d="M3 6v4a2 2 0 0 0 2 2h3" />
    <path d="M3 10v6a2 2 0 0 0 2 2h3" />
  {:else if icon === "brackets"}
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M16 3h3a2 2 0 0 1 2 2v3" />
    <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
  {:else if icon === "braces"}
    <path
      d="M8 3H7a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1"
    />
    <path
      d="M16 3h1a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-1"
    />
  {:else if icon === "text"}
    <path d="M17 6.1H3" />
    <path d="M21 12.1H3" />
    <path d="M15.1 18H3" />
  {:else if icon === "binary"}
    <rect x="14" y="14" width="4" height="6" rx="2" />
    <rect x="6" y="4" width="4" height="6" rx="2" />
    <path d="M6 20h4" />
    <path d="M8 20v-6" />
    <path d="M14 10h4" />
    <path d="M16 10V4" />
  {:else if icon === "check-square"}
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  {:else if icon === "calendar"}
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M3 10h18" />
  {:else if icon === "clock"}
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  {:else if icon === "file-question"}
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
    <path d="M14 2v6h6" />
    <path d="M10 13a2 2 0 1 1 4 0c0 2-2 1.75-2 4" />
    <path d="M12 20h.01" />
  {:else if icon === "pencil"}
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  {:else if icon === "plus"}
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  {:else if icon === "clipboard-list"}
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path
      d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
    />
    <path d="M8 11h8" />
    <path d="M8 16h8" />
  {:else if icon === "circle-check"}
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  {:else if icon === "flame"}
    <path
      d="M8.5 14.5A4 4 0 0 0 12 21a4 4 0 0 0 4-4c0-3-2-4-2-7 0-2 1-4 1-4s-5 2-6 6c-1-2-2-3-2-3s-.5 2 .5 5.5Z"
    />
  {:else if icon === "check"}
    <path d="M20 6 9 17l-5-5" />
  {:else if icon === "chevron-right"}
    <path d="m9 18 6-6-6-6" />
  {:else if icon === "circle-help"}
    <circle cx="12" cy="12" r="10" />
    <path d="M9.1 9a3 3 0 1 1 5.8 1c-.7 1.2-2.1 1.4-2.7 2.7" />
    <path d="M12 17h.01" />
  {:else if icon === "triangle-alert"}
    <path
      d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"
    />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  {:else if icon === "x"}
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  {:else if icon === "zap"}
    <path d="M13 2 3 14h9l-1 8 10-12h-9Z" />
  {:else if icon === "bug"}
    <path d="M8 2l1.9 1.9" />
    <path d="M14.1 3.9 16 2" />
    <path d="M9 7h6" />
    <path d="M12 7v14" />
    <path d="M8 12H2" />
    <path d="M22 12h-6" />
    <path d="M7 17H3" />
    <path d="M21 17h-4" />
    <path d="M8 7a4 4 0 0 0-4 4v3a8 8 0 0 0 16 0v-3a4 4 0 0 0-4-4Z" />
  {:else if icon === "quote"}
    <path
      d="M3 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2H4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h2c0 4-1 6-3 8Z"
    />
    <path
      d="M15 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2h-4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h2c0 4-1 6-3 8Z"
    />
  {:else if icon === "bookmark"}
    <path d="M19 21 12 17 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" />
  {:else}
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  {/if}
</svg>
