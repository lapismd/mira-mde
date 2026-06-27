<script lang="ts">
  type Props = {
    orientation?: "horizontal" | "vertical";
    class?: string;
  };

  let { orientation = "horizontal", class: className = "" }: Props = $props();
</script>

<div
  class={`mira-separator mira-separator--${orientation} ${className}`.trim()}
  role="separator"
  aria-orientation={orientation}
></div>
