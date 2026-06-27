<script lang="ts">
  import type { Snippet } from "svelte";
  import {
    buttonVariants,
    type ButtonSize,
    type ButtonVariant,
  } from "./variants";

  type Props = {
    variant?: ButtonVariant;
    size?: ButtonSize;
    class?: string;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    title?: string;
    "aria-label"?: string;
    onclick?: (event: MouseEvent) => void;
    children?: Snippet;
  };

  let {
    variant = "default",
    size = "default",
    class: className = "",
    disabled = false,
    type = "button",
    title,
    "aria-label": ariaLabel,
    onclick,
    children,
  }: Props = $props();
</script>

<button
  class={buttonVariants({ variant, size, class: className })}
  {disabled}
  {type}
  {title}
  aria-label={ariaLabel}
  {onclick}
>
  {@render children?.()}
</button>
