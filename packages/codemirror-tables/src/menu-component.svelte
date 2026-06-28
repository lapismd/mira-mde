<script lang="ts">
  // @ts-nocheck
  import * as ContextMenu from "@mira-mde/ui/context-menu";
  import { Menu, MenuItem, MenuSeparator } from "./menu";

  let { menu }: { menu: Menu } = $props();
</script>

<ContextMenu.Content>
  {#each menu.entries as entry}
    {#if entry instanceof MenuSeparator}
      <ContextMenu.Separator />
    {:else if entry instanceof MenuItem}
      <ContextMenu.Item onclick={entry.click}>{entry.title}</ContextMenu.Item>
    {:else}
      <ContextMenu.Sub>
        <ContextMenu.SubTrigger>{entry.title}</ContextMenu.SubTrigger>
        <ContextMenu.SubContent>
          {#each entry.entries as subEntry}
            {#if subEntry instanceof MenuSeparator}
              <ContextMenu.Separator />
            {:else if subEntry instanceof MenuItem}
              <ContextMenu.Item onclick={subEntry.click}
                >{subEntry.title}</ContextMenu.Item
              >
            {/if}
          {/each}
        </ContextMenu.SubContent>
      </ContextMenu.Sub>
    {/if}
  {/each}
</ContextMenu.Content>
