<script lang="ts">
  import "@mira-mde/ui/styles.css";
  import "@mira-mde/preview/styles.css";
  import "@mira-mde/svelte/styles.css";
  import "../app.css";

  let { children } = $props();
</script>

{@render children()}
