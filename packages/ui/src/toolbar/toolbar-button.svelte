<script lang="ts">
  import { Toolbar as ToolbarPrimitive } from "bits-ui";
  import { cn } from "../utils.js";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: ToolbarPrimitive.ButtonProps = $props();
</script>

<ToolbarPrimitive.Button
  bind:ref
  data-slot="toolbar-button"
  class={cn("mira-toolbar__button", className)}
  {...restProps}
/>
