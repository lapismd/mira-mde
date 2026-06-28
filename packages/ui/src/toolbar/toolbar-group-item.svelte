<script lang="ts">
  import { Toolbar as ToolbarPrimitive } from "bits-ui";
  import { cn } from "../utils.js";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: ToolbarPrimitive.GroupItemProps = $props();
</script>

<ToolbarPrimitive.GroupItem
  bind:ref
  data-slot="toolbar-group-item"
  class={cn("mira-toolbar__group-item", className)}
  {...restProps}
/>
