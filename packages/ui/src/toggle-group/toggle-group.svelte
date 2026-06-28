<script lang="ts">
  import type { Snippet } from "svelte";

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

  let root: HTMLDivElement | null = $state(null);

  function handleSelect(event: Event): void {
    const next =
      event instanceof CustomEvent && typeof event.detail === "string"
        ? event.detail
        : "";
    if (!next) {
      return;
    }
    value = next;
    onValueChange?.(next);
  }

  function toggleGroupEvents(node: HTMLDivElement): { destroy: () => void } {
    const listener = (event: Event) => handleSelect(event);
    node.addEventListener("miratoggleselect", listener);
    return {
      destroy() {
        node.removeEventListener("miratoggleselect", listener);
      },
    };
  }

  function syncItems(
    element: HTMLDivElement | null,
    activeValue: string,
  ): void {
    if (!element) {
      return;
    }

    for (const item of element.querySelectorAll<HTMLButtonElement>(
      "[data-mira-toggle-value]",
    )) {
      const active = item.dataset.miraToggleValue === activeValue;
      item.dataset.state = active ? "on" : "off";
      item.setAttribute("aria-pressed", String(active));
    }
  }

  $effect(() => {
    syncItems(root, value);
  });
</script>

<div
  bind:this={root}
  use:toggleGroupEvents
  class={`mira-toggle-group ${className}`.trim()}
  role="group"
  aria-label={ariaLabel}
>
  {@render children?.()}
</div>
