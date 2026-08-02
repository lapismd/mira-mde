<script lang="ts">
  type IconName =
    | "check"
    | "chevron-down"
    | "chevron-left"
    | "chevron-right"
    | "chevron-up"
    | "code-xml"
    | "move-horizontal"
    | "refresh-ccw"
    | "x"
    | "zoom-in"
    | "zoom-out";

  type Props = {
    name: IconName;
    class?: string;
  };

  let { name, class: className = "" }: Props = $props();
</script>

<svg
  class={`svg-icon mira-mermaid-icon ${className}`.trim()}
  aria-hidden="true"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  {#if name === "check"}
    <path d="M20 6 9 17l-5-5" />
  {:else if name === "chevron-down"}
    <path d="m6 9 6 6 6-6" />
  {:else if name === "chevron-left"}
    <path d="m15 18-6-6 6-6" />
  {:else if name === "chevron-right"}
    <path d="m9 18 6-6-6-6" />
  {:else if name === "chevron-up"}
    <path d="m18 15-6-6-6 6" />
  {:else if name === "code-xml"}
    <path d="m18 16 4-4-4-4" />
    <path d="m6 8-4 4 4 4" />
    <path d="m14.5 4-5 16" />
  {:else if name === "move-horizontal"}
    <path d="M18 8 22 12 18 16" />
    <path d="M6 8 2 12 6 16" />
    <path d="M2 12H22" />
  {:else if name === "refresh-ccw"}
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  {:else if name === "x"}
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  {:else if name === "zoom-in"}
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
    <path d="M11 8v6" />
    <path d="M8 11h6" />
  {:else if name === "zoom-out"}
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
    <path d="M8 11h6" />
  {/if}
</svg>
