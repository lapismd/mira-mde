<script lang="ts">
  import type { HTMLTableAttributes } from "svelte/elements";
  import { cn, type WithElementRef } from "../utils.js";

  let {
    ref = $bindable(null),
    class: tableClass,
    className = "overflow-auto",
    children,
    ...restProps
  }: WithElementRef<HTMLTableAttributes> & { className?: string } = $props();
</script>

<table
  bind:this={ref}
  data-slot="table"
  class={cn("w-full caption-bottom text-sm", className, tableClass)}
  {...restProps}
>
  {@render children?.()}
</table>
