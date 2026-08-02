<script lang="ts">
  // @ts-nocheck
  import AlignCenterIcon from "@lucide/svelte/icons/align-center";
  import AlignJustifyIcon from "@lucide/svelte/icons/align-justify";
  import AlignLeftIcon from "@lucide/svelte/icons/align-left";
  import AlignRightIcon from "@lucide/svelte/icons/align-right";
  import AlignVerticalCenterIcon from "@lucide/svelte/icons/align-vertical-justify-center";
  import AlignVerticalEndIcon from "@lucide/svelte/icons/align-vertical-justify-end";
  import AlignVerticalStartIcon from "@lucide/svelte/icons/align-vertical-justify-start";
  import ArrowUpDownIcon from "@lucide/svelte/icons/arrow-up-down";
  import Columns3Icon from "@lucide/svelte/icons/columns-3";
  import CopyIcon from "@lucide/svelte/icons/copy";
  import EraserIcon from "@lucide/svelte/icons/eraser";
  import MoveIcon from "@lucide/svelte/icons/move";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import Repeat2Icon from "@lucide/svelte/icons/repeat-2";
  import Rows3Icon from "@lucide/svelte/icons/rows-3";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import * as ContextMenu from "@mira-mde/ui/context-menu";
  import { Menu, MenuItem, MenuSeparator } from "./menu";

  let { menu }: { menu: Menu } = $props();

  function menuEntryIcon(title: string) {
    const normalized = title.toLowerCase();
    if (normalized === "row") return Rows3Icon;
    if (normalized === "column") return Columns3Icon;
    if (normalized === "vertical align") return AlignVerticalCenterIcon;
    if (normalized.startsWith("add ")) return PlusIcon;
    if (normalized.startsWith("move ")) return MoveIcon;
    if (normalized.startsWith("duplicate ")) return CopyIcon;
    if (normalized.startsWith("delete")) return Trash2Icon;
    if (normalized.startsWith("clear ")) return EraserIcon;
    if (normalized.startsWith("sort ")) return ArrowUpDownIcon;
    if (normalized === "transpose") return Repeat2Icon;
    if (normalized === "align" || normalized.endsWith(" left"))
      return AlignLeftIcon;
    if (normalized === "left") return AlignLeftIcon;
    if (normalized === "center" || normalized.endsWith(" center"))
      return AlignCenterIcon;
    if (normalized === "right" || normalized.endsWith(" right"))
      return AlignRightIcon;
    if (normalized === "justify") return AlignJustifyIcon;
    if (normalized === "top") return AlignVerticalStartIcon;
    if (normalized === "middle") return AlignVerticalCenterIcon;
    if (normalized === "bottom") return AlignVerticalEndIcon;
    return undefined;
  }
</script>

<ContextMenu.Content>
  {#each menu.entries as entry}
    {#if entry instanceof MenuSeparator}
      <ContextMenu.Separator />
    {:else if entry instanceof MenuItem}
      {@const EntryIcon = menuEntryIcon(entry.title)}
      <ContextMenu.Item onclick={entry.click}>
        {#if EntryIcon}
          <EntryIcon aria-hidden="true" />
        {:else}
          <span class="mira-table-menu__icon-placeholder" aria-hidden="true"
          ></span>
        {/if}
        {entry.title}
      </ContextMenu.Item>
    {:else}
      {@const EntryIcon = menuEntryIcon(entry.title)}
      <ContextMenu.Sub>
        <ContextMenu.SubTrigger>
          {#if EntryIcon}
            <EntryIcon aria-hidden="true" />
          {:else}
            <span class="mira-table-menu__icon-placeholder" aria-hidden="true"
            ></span>
          {/if}
          {entry.title}
        </ContextMenu.SubTrigger>
        <ContextMenu.SubContent>
          {#each entry.entries as subEntry}
            {#if subEntry instanceof MenuSeparator}
              <ContextMenu.Separator />
            {:else if subEntry instanceof MenuItem}
              {@const SubEntryIcon = menuEntryIcon(subEntry.title)}
              <ContextMenu.Item onclick={subEntry.click}>
                {#if SubEntryIcon}
                  <SubEntryIcon aria-hidden="true" />
                {:else}
                  <span
                    class="mira-table-menu__icon-placeholder"
                    aria-hidden="true"
                  ></span>
                {/if}
                {subEntry.title}
              </ContextMenu.Item>
            {/if}
          {/each}
        </ContextMenu.SubContent>
      </ContextMenu.Sub>
    {/if}
  {/each}
</ContextMenu.Content>

<style>
  .mira-table-menu__icon-placeholder {
    flex: 0 0 1rem;
    height: 1rem;
    width: 1rem;
  }
</style>
