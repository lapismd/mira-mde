<script lang="ts">
  type Props = {
    value?: string;
    ref?: HTMLSpanElement | null;
  };

  let { value = "", ref = $bindable(null) }: Props = $props();
</script>

<span bind:this={ref} class="mira-tag">{value}</span>
