<script lang="ts">
  import { Popover as PopoverPrimitive } from "bits-ui";
  import { getContext } from "svelte";
  import {
    popoverPortalContextKey,
    type OverlayPortalContext,
  } from "../internal/overlay-portal-context.js";

  let { ref = $bindable(null), ...restProps }: PopoverPrimitive.TriggerProps =
    $props();

  const portalContext = getContext<OverlayPortalContext | undefined>(
    popoverPortalContextKey,
  );

  $effect(() => {
    if (portalContext) {
      portalContext.portalTarget = ref?.ownerDocument.body ?? null;
    }
  });
</script>

<PopoverPrimitive.Trigger bind:ref data-slot="popover-trigger" {...restProps} />
