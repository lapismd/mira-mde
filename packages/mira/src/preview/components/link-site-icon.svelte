<script lang="ts">
  import {
    defaultMiraLinkIconRegistry,
    type MiraLinkIconRegistry,
  } from "../../internal/inline-links/registry";
  let {
    href,
    registry = defaultMiraLinkIconRegistry,
    class: className = "",
  }: {
    href: string;
    registry?: MiraLinkIconRegistry;
    class?: string;
  } = $props();
  const resolved = $derived(registry.resolve(href));
</script>

{#if resolved?.icon}
  <svg
    class={`mira-link-site-icon ${className}`.trim()}
    data-link-site={resolved.id}
    viewBox={resolved.icon.viewBox ?? "0 0 24 24"}
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    {#each resolved.icon.paths as path}
      <path
        d={path.d}
        fill={path.fill}
        stroke={path.stroke}
        stroke-width={path.strokeWidth}
        stroke-linecap={path.strokeLinecap}
        stroke-linejoin={path.strokeLinejoin}
        fill-rule={path.fillRule}
      />
    {/each}
  </svg>
{/if}
