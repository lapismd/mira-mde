<script lang="ts">
  import TableReader from "./table-reader.svelte";
  let { markdown }: { markdown: string } = $props();
</script>

<TableReader {markdown} breakAfterRows={[1]}>
  {#snippet cell({ row, column, text })}<span data-cell={`${row}:${column}`}
      >{text}</span
    >{/snippet}
  {#snippet afterRow(row)}<aside>Comment after row {row}</aside>{/snippet}
</TableReader>
