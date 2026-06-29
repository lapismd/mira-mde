<script lang="ts">
  // @ts-nocheck
  import { createDraggable, createDroppable } from "@dnd-kit/svelte";
  import GripHorizontal from "@lucide/svelte/icons/grip-horizontal";
  import * as Table from "@mira-mde/ui/table";
  import { Button } from "@mira-mde/ui/button";
  import { cn } from "./utils";
  import type { MarkdownTableDragSource } from "./markdown-table-dnd";
  import {
    dropIndicatorClasses,
    MARKDOWN_TABLE_COL_TYPE,
    MARKDOWN_TABLE_ROW_TYPE,
  } from "./markdown-table-dnd";

  type Props = {
    index: number;
    dragSource: MarkdownTableDragSource | null;
    dragOverIndex: number | null;
    class?: string;
    onSelectColumn: (event: Event) => void;
    children?: import("svelte").Snippet;
  };

  let {
    index,
    dragSource,
    dragOverIndex,
    class: className,
    onSelectColumn,
    children,
  }: Props = $props();

  let headRef = $state<HTMLElement | null>(null);

  const colDraggable = createDraggable({
    get id() {
      return `markdown-table-col:${index}`;
    },
    type: MARKDOWN_TABLE_COL_TYPE,
    get data() {
      return { type: MARKDOWN_TABLE_COL_TYPE, index };
    },
  });

  const colDroppable = createDroppable({
    get id() {
      return `markdown-table-col-drop:head:${index}`;
    },
    accept: MARKDOWN_TABLE_COL_TYPE,
    get data() {
      return { type: MARKDOWN_TABLE_COL_TYPE, index };
    },
  });

  $effect(() => {
    if (!headRef) {
      return;
    }
    const cleanupDraggable = colDraggable.attach(headRef);
    const cleanupDroppable = colDroppable.attach(headRef);
    return () => {
      cleanupDraggable();
      cleanupDroppable();
    };
  });
</script>

<Table.Head
  bind:ref={headRef}
  data-markdown-table-col-index={index}
  class={cn(
    "markdown-table-chrome markdown-table-chrome--cell group relative h-5 border-b p-0 opacity-0 group-hover:opacity-100",
    className,
    dropIndicatorClasses(dragSource, dragOverIndex, -1, index),
    dragSource?.type === MARKDOWN_TABLE_COL_TYPE &&
      dragSource.index === index &&
      "is-drag-source is-col-drag-source",
  )}
  data-markdown-table-chrome="col-header"
>
  <Button
    variant="ghost"
    size="xs"
    data-grab-handle=""
    data-markdown-table-drag-handle="col"
    data-markdown-table-drag-index={index}
    class="markdown-table-chrome markdown-table-chrome--drag-handle absolute bottom-[-0.5rem] left-1/2 z-10 cursor-grab opacity-0 group-hover:opacity-100"
    aria-label="Drag column"
    onclick={(event) => {
      event.stopPropagation();
      onSelectColumn(event);
    }}
    {@attach colDraggable.attachHandle}
  >
    <GripHorizontal />
  </Button>
  <div class="flex justify-end">
    {@render children?.()}
  </div>
</Table.Head>
