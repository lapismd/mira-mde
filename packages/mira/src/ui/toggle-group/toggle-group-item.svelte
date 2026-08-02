<script lang="ts">
  import type { Snippet } from "svelte";

  type Props = {
    value: string;
    class?: string;
    title?: string;
    children?: Snippet;
  };

  let { value, class: className = "", title, children }: Props = $props();

  function select(event: MouseEvent): void {
    event.currentTarget?.dispatchEvent(
      new CustomEvent("miratoggleselect", {
        bubbles: true,
        detail: value,
      }),
    );
  }
</script>

<button
  type="button"
  class={`mira-toggle-group__item ${className}`.trim()}
  aria-pressed="false"
  data-mira-toggle-value={value}
  data-state="off"
  {title}
  onclick={select}
>
  {@render children?.()}
</button>
