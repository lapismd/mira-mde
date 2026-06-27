<script lang="ts">
  type Props = {
    frontmatter?: string;
    ref?: HTMLElement | null;
  };

  let { frontmatter = "", ref = $bindable(null) }: Props = $props();
</script>

<details bind:this={ref} class="mira-frontmatter">
  <summary>Properties</summary>
  <pre>{frontmatter}</pre>
</details>
