<script lang="ts">
  import { Tooltip as TooltipPrimitive } from "bits-ui";
  import { setContext } from "svelte";
  import {
    createOverlayPortalContext,
    tooltipPortalContextKey,
  } from "../internal/overlay-portal-context.js";

  let { open = $bindable(false), ...restProps }: TooltipPrimitive.RootProps =
    $props();

  setContext(tooltipPortalContextKey, createOverlayPortalContext());
</script>

<TooltipPrimitive.Root bind:open {...restProps} />
