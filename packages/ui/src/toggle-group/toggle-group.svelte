<script lang="ts">
  import type { Snippet } from "svelte";
  import { setToggleGroupContext } from "./context";

  type Props = {
    value: string;
    class?: string;
    "aria-label"?: string;
    onValueChange?: (value: string) => void;
    children?: Snippet;
  };

  let {
    value = $bindable(""),
    class: className = "",
    "aria-label": ariaLabel,
    onValueChange,
    children,
  }: Props = $props();

  setToggleGroupContext({
    value: () => value,
    setValue(next) {
      value = next;
      onValueChange?.(next);
    },
  });
</script>

<div
  class={`mira-toggle-group ${className}`.trim()}
  role="group"
  aria-label={ariaLabel}
>
  {@render children?.()}
</div>
