<script lang="ts">
  import { Toolbar as ToolbarPrimitive } from "bits-ui";
  import { cn } from "../utils.js";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: ToolbarPrimitive.LinkProps = $props();
</script>

<ToolbarPrimitive.Link
  bind:ref
  data-slot="toolbar-link"
  class={cn("mira-toolbar__link", className)}
  {...restProps}
/>
