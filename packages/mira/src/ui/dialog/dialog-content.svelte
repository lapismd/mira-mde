<script lang="ts">
  import { Dialog as DialogPrimitive } from "bits-ui";
  import XIcon from "@lucide/svelte/icons/x";
  import { getContext, type Snippet } from "svelte";
  import * as Dialog from "./index.js";
  import { cn, type WithoutChildrenOrChild } from "../utils.js";
  import {
    miraAppearanceContextKey,
    miraColorModeAttribute,
    miraColorModeClassName,
    normalizeMiraTheme,
    type MiraAppearanceContext,
  } from "../../internal/appearance-context.js";

  let {
    ref = $bindable(null),
    class: className,
    portalProps,
    children,
    showCloseButton = true,
    ...restProps
  }: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & {
    portalProps?: DialogPrimitive.PortalProps;
    children: Snippet;
    showCloseButton?: boolean;
  } = $props();

  const appearance = getContext<MiraAppearanceContext | undefined>(
    miraAppearanceContextKey,
  );
  const appearanceTheme = $derived(normalizeMiraTheme(appearance?.theme));
  const appearanceMode = $derived(
    miraColorModeAttribute(appearance?.colorMode),
  );
  const appearanceClass = $derived(
    miraColorModeClassName(appearance?.colorMode),
  );
</script>

<Dialog.Portal {...portalProps}>
  <Dialog.Overlay />
  <DialogPrimitive.Content
    bind:ref
    data-slot="dialog-content"
    data-mira-overlay
    data-mira-theme={appearanceTheme}
    data-mira-color-mode={appearanceMode}
    class={cn(
      "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 duration-200 sm:max-w-lg",
      appearanceClass,
      className,
    )}
    {...restProps}
  >
    {@render children?.()}
    {#if showCloseButton}
      <DialogPrimitive.Close
        data-slot="dialog-close"
        class="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
      >
        <XIcon />
        <span class="sr-only">Close</span>
      </DialogPrimitive.Close>
    {/if}
  </DialogPrimitive.Content>
</Dialog.Portal>
