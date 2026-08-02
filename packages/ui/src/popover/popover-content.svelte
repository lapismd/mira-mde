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
</script>

<PopoverPrimitive.Portal
  {...resolveOverlayPortalProps(portalContext, portalProps, disablePortals)}
>
  <PopoverPrimitive.Content
    bind:ref
    data-slot="popover-content"
    {sideOffset}
    {align}
    class={cn(
      "bg-popover text-popover-foreground z-[1100] w-72 rounded-md border p-4 outline-hidden",
      className,
    )}
    {...restProps}
  />
</PopoverPrimitive.Portal>
