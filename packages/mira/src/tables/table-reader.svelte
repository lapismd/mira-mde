<script lang="ts">
  import type { Snippet } from "svelte";
  import { TableNode } from "./table-node";
  import { MarkdownPreview } from "@lapismd/mira/preview";
  import type { MiraExtension } from "../extensions";
  import * as Table from "@lapismd/mira/ui/table";

  let {
    markdown,
    cell,
    breakAfterRows = [],
    afterRow,
    extensions = [],
    label = "Markdown table",
    showHeader = true,
  }: {
    markdown: string;
    /** Render original source-aware cells without enabling table mutations. */
    cell?: Snippet<[{ row: number; column: number; text: string }]>;
    /** Zero-based source rows, including the header at row zero. */
    breakAfterRows?: readonly number[];
    afterRow?: Snippet<[number]>;
    extensions?: MiraExtension[];
    label?: string;
    showHeader?: boolean;
  } = $props();
  const table = $derived(TableNode.fromMarkdown(markdown)?.getMdastNode());
  const rows = $derived(table?.children ?? []);
  const segments = $derived.by(() => {
    const ends = [...new Set([...breakAfterRows, rows.length - 1])]
      .filter((row) => Number.isInteger(row) && row >= 0 && row < rows.length)
      .sort((a, b) => a - b);
    let start = 0;
    return ends.map((end) => {
      const segment = { start, end };
      start = end + 1;
      return segment;
    });
  });
</script>

<div class="mira-table-reader">
  {#each segments as segment (segment.start)}
    <div class="mira-table-reader__scroll">
      <Table.Root aria-label={label} class="mira-table-reader__table">
        <Table.Body>
          {#each rows.slice(segment.start, segment.end + 1) as row, index (segment.start + index)}
            {@const rowIndex = segment.start + index}
            {#if showHeader || rowIndex > 0}
              <Table.Row>
                {#each row.children as value, column (column)}
                  {@const text = TableNode.toMarkdown(value).trim()}
                  <svelte:element
                    this={rowIndex === 0 ? "th" : "td"}
                    scope={rowIndex === 0 ? "col" : undefined}
                    style:text-align={table?.align?.[column] ?? "left"}
                  >
                    {#if cell}{@render cell({ row: rowIndex, column, text })}
                    {:else}<MarkdownPreview
                        value={text}
                        inline
                        htmlPolicy="safe"
                        {extensions}
                      />{/if}
                  </svelte:element>
                {/each}
              </Table.Row>
            {/if}
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
    {#if breakAfterRows.includes(segment.end)}{@render afterRow?.(
        segment.end,
      )}{/if}
  {/each}
</div>

<style>
  .mira-table-reader {
    min-width: 0;
  }
  .mira-table-reader__scroll {
    overflow-x: auto;
  }
  .mira-table-reader :global(.mira-table-reader__table) {
    border-collapse: collapse;
    table-layout: fixed;
    width: 100%;
  }
  .mira-table-reader
    :global(.mira-table-reader__table > tbody > tr > :is(td, th)) {
    border: 1px solid var(--mira-border, var(--border));
    padding: var(--mira-table-reader-cell-padding, 0.375rem 0.625rem);
    vertical-align: top;
  }
  .mira-table-reader :global(.mira-table-reader__table > tbody > tr > th) {
    background: var(--mira-muted, var(--muted));
    font-weight: 600;
  }
</style>
