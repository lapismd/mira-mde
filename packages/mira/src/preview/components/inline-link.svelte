<script lang="ts">
  import { getContext, type Snippet } from "svelte";
  import {
    miraAppearanceContextKey,
    resolveMiraThemeAttribute,
    resolveMiraColorModeAttribute,
    type MiraAppearanceContext,
  } from "../../internal/appearance-context";
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import * as Tooltip from "../../ui/tooltip";
  import LinkSiteIcon from "./link-site-icon.svelte";
  import {
    defaultMiraLinkIconRegistry,
    parseInlineLinkUrl,
    type MiraLinkIconRegistry,
  } from "../../internal/inline-links/registry";
  let {
    href = "",
    label,
    registry = defaultMiraLinkIconRegistry,
    children,
    title,
    class: className = "",
    target = "_blank",
    rel,
    ref = $bindable(null),
    tagName: _tagName,
    sourcePath: _sourcePath,
    dialog: _dialog,
    ...rest
  }: Omit<HTMLAnchorAttributes, "children"> & {
    registry?: MiraLinkIconRegistry;
    label?: string;
    children?: Snippet;
    ref?: HTMLAnchorElement | null;
    tagName?: string;
    sourcePath?: string;
    dialog?: boolean;
  } = $props();
  const safeHref = $derived(parseInlineLinkUrl(href ?? "")?.href);
  const appearance = getContext<MiraAppearanceContext | undefined>(
    miraAppearanceContextKey,
  );
  const appearanceTheme = $derived(
    resolveMiraThemeAttribute(appearance?.theme, ref),
  );
  const appearanceMode = $derived(
    resolveMiraColorModeAttribute(appearance?.colorMode, ref),
  );
  const showDestination = $derived(
    Boolean(safeHref && (title || children || (label && label !== href))),
  );
  const safeRel = $derived(
    target === "_blank"
      ? [
          ...new Set(`${rel ?? ""} noopener noreferrer`.trim().split(/\s+/u)),
        ].join(" ")
      : rel,
  );
</script>

<Tooltip.Provider delayDuration={200}>
  <Tooltip.Root disabled={!showDestination}>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <a
          {...props}
          {...rest}
          bind:this={ref}
          class={`mira-inline-link ${className}`.trim()}
          href={safeHref}
          {title}
          {target}
          rel={safeRel}
        >
          {#if safeHref}<LinkSiteIcon href={safeHref} {registry} />{/if}<span
            >{#if children}{@render children()}{:else}{label || href}{/if}</span
          >
        </a>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content
      role="tooltip"
      side="top"
      sideOffset={6}
      data-mira-theme={appearanceTheme}
      data-mira-color-mode={appearanceMode}
    >
      {#if title}<span>{title}</span><br />{/if}<span
        class="mira-inline-link__destination">{safeHref}</span
      >
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
