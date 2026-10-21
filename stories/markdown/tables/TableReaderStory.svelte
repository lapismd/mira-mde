<script lang="ts">
  import { TableReader } from "@lapismd/mira/tables";

  const markdown = `| Change | Owner | Status |
| --- | --- | --- |
| Safe syntax highlighting | Mira | Ready |
| Annotated table reading | Design Core | Review |
| Public registry adoption | Desktop | Pending |`;
</script>

<section class="mira-story-surface">
  <TableReader {markdown} breakAfterRows={[1]} label="Release review">
    {#snippet afterRow(row)}
      <aside aria-label="Review comment" data-source-row={row}>
        Keep the highlighted tokens when the preview uses safe HTML.
      </aside>
    {/snippet}
  </TableReader>
</section>

<style>
  aside {
    margin-block: 0.75rem;
    padding: 0.75rem;
    border: 1px solid var(--mira-border);
    border-radius: var(--mira-radius);
    color: var(--mira-muted-foreground);
  }
</style>
