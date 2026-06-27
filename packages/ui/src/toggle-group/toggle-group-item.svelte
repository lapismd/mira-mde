<script lang="ts">
  import type { Snippet } from "svelte";
  import { useToggleGroupContext } from "./context";

  type Props = {
    value: string;
    class?: string;
    title?: string;
    children?: Snippet;
  };

  let { value, class: className = "", title, children }: Props = $props();
  const group = useToggleGroupContext();
  const active = $derived(group.value() === value);
</script>

<button
  type="button"
  class={`mira-toggle-group__item ${className}`.trim()}
  aria-pressed={active}
  data-state={active ? "on" : "off"}
  {title}
  onclick={() => group.setValue(value)}
>
  {@render children?.()}
</button>
