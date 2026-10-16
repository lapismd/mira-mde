<script lang="ts">
  import * as Tooltip from "../../ui/tooltip";
  let { anchor }: { anchor: HTMLAnchorElement } = $props();
  const id = $props.id();
  let open = $state(false);
  const theme = $derived(
    anchor.closest<HTMLElement>("[data-mira-theme]")?.dataset.miraTheme,
  );
  const colorMode = $derived(
    anchor.closest<HTMLElement>("[data-mira-color-mode]")?.dataset
      .miraColorMode,
  );
  $effect(() => {
    const show = () => (open = true);
    const hide = () => (open = false);
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide();
    };
    anchor.addEventListener("pointerenter", show);
    anchor.addEventListener("pointerleave", hide);
    anchor.addEventListener("focus", show);
    anchor.addEventListener("blur", hide);
    anchor.addEventListener("keydown", escape);
    if (anchor.matches(":focus, :hover")) show();
    return () => {
      anchor.removeEventListener("pointerenter", show);
      anchor.removeEventListener("pointerleave", hide);
      anchor.removeEventListener("focus", show);
      anchor.removeEventListener("blur", hide);
      anchor.removeEventListener("keydown", escape);
    };
  });
  $effect(() => {
    if (!open) return;
    const previous = anchor.getAttribute("aria-describedby");
    anchor.setAttribute(
      "aria-describedby",
      [previous, id].filter(Boolean).join(" "),
    );
    return () => {
      if (previous) anchor.setAttribute("aria-describedby", previous);
      else anchor.removeAttribute("aria-describedby");
    };
  });
</script>

<Tooltip.Provider>
  <Tooltip.Root bind:open>
    <Tooltip.Content
      {id}
      role="tooltip"
      customAnchor={anchor}
      side="top"
      sideOffset={6}
      data-mira-theme={theme}
      data-mira-color-mode={colorMode}
    >
      {#if anchor.title}<span>{anchor.title}</span><br />{/if}<span
        class="mira-inline-link__destination">{anchor.href}</span
      >
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
