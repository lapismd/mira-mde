<script lang="ts">
  type Props = {
    class?: string;
    name?: string;
    value?: string;
    ref?: HTMLSpanElement | null;
  };

  let {
    class: className = "",
    name,
    value = "",
    ref = $bindable(null),
  }: Props = $props();
  const label = $derived(name ?? value);
</script>

<span bind:this={ref} class={`tag mira-tag ${className}`.trim()}>{label}</span>
