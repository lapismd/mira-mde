<script lang="ts">
  import { Toolbar as ToolbarPrimitive } from "bits-ui";
  import { cn } from "../utils.js";

  let {
    ref = $bindable(null),
    class: className,
    orientation = "horizontal",
    loop = true,
    ...restProps
  }: ToolbarPrimitive.RootProps = $props();
</script>

<ToolbarPrimitive.Root
  bind:ref
  data-slot="toolbar"
  {orientation}
  {loop}
  class={cn("mira-toolbar", className)}
  {...restProps}
/>
