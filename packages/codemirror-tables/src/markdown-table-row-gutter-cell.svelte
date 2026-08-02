<script lang="ts">
  // @ts-nocheck
  import { createDraggable, createDroppable } from "@dnd-kit/svelte";
  import GripVertical from "@lucide/svelte/icons/grip-vertical";
  import Elipsis from "@lucide/svelte/icons/ellipsis";
  import * as Table from "@mira-mde/ui/table";
  import { Button, buttonVariants } from "@mira-mde/ui/button";
  import * as DropdownMenu from "@mira-mde/ui/dropdown-menu";
  import { DropdownMenuItem } from "@mira-mde/ui/dropdown-menu";
  import Delete from "@lucide/svelte/icons/trash";
  import { cn } from "./utils";
  import type { MarkdownTableDragSource } from "./markdown-table-dnd";
  import {
    dropIndicatorClasses,
    MARKDOWN_TABLE_ROW_TYPE,
  } from "./markdown-table-dnd";

  type Props = {
    rowIndex: number;
    colIndex: number;
    chromeActive?: boolean;
    dragSource: MarkdownTableDragSource | null;
    dragOverIndex: number | null;
    onSelectRow: (event: Event) => void;
    onInsertRow: (event: Event, index: number) => void;
    onDeleteRow: (event: Event, index: number) => void;
  };

  let {
    rowIndex,
    colIndex,
    chromeActive = false,
    dragSource,
    dragOverIndex,
    onSelectRow,
    onInsertRow,
    onDeleteRow,
  }: Props = $props();

  let cellRef = $state<HTMLElement | null>(null);

  const rowDraggable = createDraggable({
    get id() {
      return `markdown-table-row:${rowIndex}`;
    },
    type: MARKDOWN_TABLE_ROW_TYPE,
    get data() {
      return { type: MARKDOWN_TABLE_ROW_TYPE, index: rowIndex };
    },
  });

  const rowDroppable = createDroppable({
    get id() {
      return `markdown-table-row-drop:${rowIndex}:grip`;
    },
    accept: MARKDOWN_TABLE_ROW_TYPE,
    get data() {
      return { type: MARKDOWN_TABLE_ROW_TYPE, index: rowIndex };
    },
  });

  $effect(() => {
    if (!cellRef) {
      return;
    }
    const cleanupDraggable = rowDraggable.attach(cellRef);
    const cleanupDroppable = rowDroppable.attach(cellRef);
    return () => {
      cleanupDraggable();
      cleanupDroppable();
    };
  });
</script>

<Table.Cell
  bind:ref={cellRef}
  class={cn(
    "markdown-table-chrome markdown-table-chrome--gutter-cell relative w-[2rem] border-r p-0 opacity-0 group-hover:border-y group-hover:border-l group-hover:opacity-100",
    chromeActive && "is-chrome-active",
    dropIndicatorClasses(dragSource, dragOverIndex, rowIndex, colIndex),
    dragSource?.type === MARKDOWN_TABLE_ROW_TYPE &&
      dragSource.index === rowIndex &&
      "is-drag-source is-row-drag-source",
  )}
  data-markdown-table-chrome="row-gutter"
>
  <Button
    variant="ghost"
    size="xs"
    data-grab-handle=""
    data-markdown-table-drag-handle="row"
    data-markdown-table-drag-index={rowIndex}
    class="markdown-table-chrome markdown-table-chrome--drag-handle absolute top-1/2 right-[-0.5rem] z-10 cursor-grab opacity-0 group-hover:opacity-100"
    aria-label="Drag row"
    onclick={(event) => {
      event.stopPropagation();
      onSelectRow(event);
    }}
    {@attach rowDraggable.attachHandle}
  >
    <GripVertical />
  </Button>
  <DropdownMenu.Root>
    <DropdownMenu.Trigger
      aria-label={`Row ${rowIndex + 1} actions`}
      class={buttonVariants({
        variant: "ghost",
        size: "xs",
        class:
          "markdown-table-chrome h-5 w-5 p-0 opacity-40 group-hover:opacity-100",
      })}
    >
      <Elipsis />
    </DropdownMenu.Trigger>
    <DropdownMenu.Content class="flex">
      <DropdownMenuItem
        aria-label="Insert row above"
        title="Insert a row above this one"
        class="[&_svg]:size-5"
        onclick={(evt) => onInsertRow(evt, rowIndex)}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          ><path
            d="M20.1152 9.99987V14.3229V14.2461V14.3076V9.99987ZM19.8075 15.8076C20.3127 15.8076 20.7402 15.6326 21.0902 15.2826C21.4402 14.9326 21.6152 14.505 21.6152 13.9999V10.3076C21.6152 9.80245 21.4402 9.37487 21.0902 9.02487C20.7402 8.67487 20.3127 8.49987 19.8075 8.49987H10.423V9.99987H19.8075C19.8973 9.99987 19.9711 10.0287 20.0287 10.0864C20.0864 10.144 20.1152 10.2178 20.1152 10.3076V13.9999C20.1152 14.0897 20.0864 14.1635 20.0287 14.2211C19.9711 14.2788 19.8973 14.3076 19.8075 14.3076H4.69223C4.74357 14.7358 4.93299 15.0928 5.26048 15.3786C5.58798 15.6646 5.97548 15.8076 6.42298 15.8076H19.8075ZM2.49998 9.99987H4.61523V12.1154H6.11523V9.99987H8.23073V8.49987H6.11523V6.38462H4.61523V8.49987H2.49998V9.99987Z"
            fill="currentColor"
          ></path></svg
        >
      </DropdownMenuItem>
      <DropdownMenuItem
        aria-label="Insert row below"
        title="Insert a row below this one"
        class="[&_svg]:size-5"
        onclick={(evt) => onInsertRow(evt, rowIndex + 1)}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          ><path
            d="M20.1152 14.1924V9.86939V9.94614V9.88464V14.1924ZM19.8075 8.38464C20.3127 8.38464 20.7402 8.55964 21.0902 8.90964C21.4402 9.25964 21.6152 9.68723 21.6152 10.1924V13.8846C21.6152 14.3898 21.4402 14.8174 21.0902 15.1674C20.7402 15.5174 20.3127 15.6924 19.8075 15.6924H10.423V14.1924H19.8075C19.8973 14.1924 19.9711 14.1636 20.0287 14.1059C20.0864 14.0482 20.1152 13.9745 20.1152 13.8846V10.1924C20.1152 10.1026 20.0864 10.0288 20.0287 9.97114C19.9711 9.91348 19.8973 9.88464 19.8075 9.88464H4.69223C4.74357 9.45648 4.93299 9.09948 5.26048 8.81364C5.58798 8.52764 5.97548 8.38464 6.42298 8.38464H19.8075ZM2.49998 14.1924H4.61523V12.0769H6.11523V14.1924H8.23073V15.6924H6.11523V17.8076H4.61523V15.6924H2.49998V14.1924Z"
            fill="currentColor"
          ></path></svg
        >
      </DropdownMenuItem>
      <DropdownMenuItem
        aria-label="Delete row"
        title="Delete row"
        class="[&_svg]:size-5"
        onclick={(evt) => onDeleteRow(evt, rowIndex)}
        ><Delete /></DropdownMenuItem
      >
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</Table.Cell>
