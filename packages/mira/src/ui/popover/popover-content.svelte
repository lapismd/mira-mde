<script lang="ts">
  import { Popover as PopoverPrimitive } from "bits-ui";
  import { getContext } from "svelte";
  import {
    disableOverlayPortalContextKey,
    popoverPortalContextKey,
    resolveOverlayPortalProps,
    type OverlayPortalContext,
  } from "../internal/overlay-portal-context.js";
  import { cn } from "../utils.js";
  import {
    miraAppearanceContextKey,
    miraColorModeAttribute,
    miraColorModeClassName,
    normalizeMiraTheme,
    type MiraAppearanceContext,
  } from "../../internal/appearance-context.js";

  let {
    ref = $bindable(null),
    class: className,
    sideOffset = 4,
    align = "center",
    portalProps,
    ...restProps
  }: PopoverPrimitive.ContentProps & {
    portalProps?: PopoverPrimitive.PortalProps;
  } = $props();

  const portalContext = getContext<OverlayPortalContext | undefined>(
    popoverPortalContextKey,
  );
  const disablePortals =
    getContext<boolean | undefined>(disableOverlayPortalContextKey) ?? false;
  const appearance = getContext<MiraAppearanceContext | undefined>(
    miraAppearanceContextKey,
  );
  const appearanceTheme = $derived(normalizeMiraTheme(appearance?.theme));
  const appearanceMode = $derived(
    miraColorModeAttribute(appearance?.colorMode),
  );
  const appearanceClass = $derived(
    miraColorModeClassName(appearance?.colorMode),
  );
</script>

<PopoverPrimitive.Portal
  {...resolveOverlayPortalProps(portalContext, portalProps, disablePortals)}
>
  <PopoverPrimitive.Content
    bind:ref
    data-slot="popover-content"
    data-mira-overlay
    data-mira-theme={appearanceTheme}
    data-mira-color-mode={appearanceMode}
    {sideOffset}
    {align}
    class={cn(
      "bg-popover text-popover-foreground z-[1100] w-72 rounded-md border p-4 outline-hidden",
      appearanceClass,
      className,
    )}
    {...restProps}
  />
</PopoverPrimitive.Portal>
