<script lang="ts">
  import { Toolbar as ToolbarPrimitive } from "bits-ui";
  import { cn } from "../utils.js";

  let {
    ref = $bindable(null),
    value = $bindable(),
    class: className,
    ...restProps
  }: ToolbarPrimitive.GroupProps = $props();
</script>

<ToolbarPrimitive.Group
  bind:ref
  bind:value
  data-slot="toolbar-group"
  class={cn("mira-toolbar__group", className)}
  {...restProps}
/>
