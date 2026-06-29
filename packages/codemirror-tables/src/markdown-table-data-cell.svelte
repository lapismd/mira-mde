<script lang="ts">
  // @ts-nocheck
  import { createDroppable } from "@dnd-kit/svelte";
  import * as Table from "@mira-mde/ui/table";
  import { cn } from "./utils";
  import type * as Mdast from "mdast";
  import ColumnEditor from "./editor-column.svelte";
  import type { MarkdownTableDragSource } from "./markdown-table-dnd";
  import {
    dropIndicatorClasses,
    MARKDOWN_TABLE_COL_TYPE,
    MARKDOWN_TABLE_ROW_TYPE,
  } from "./markdown-table-dnd";

  type Props = {
    node: Mdast.Nodes;
    rowIndex: number;
    colIndex: number;
    sourceRowIndex?: number;
    sourceColIndex?: number;
    align: string | null | undefined;
    colspan?: number;
    rowspan?: number;
    readonly?: boolean;
    selectedClass?: string;
    dragSource: MarkdownTableDragSource | null;
    dragOverIndex: number | null;
    onContentChange: (value: string) => void;
    onMouseOver: (event: MouseEvent) => void;
    onMouseDown: (event: MouseEvent) => void;
    onContextMenu: () => void;
  };

  let {
    node,
    rowIndex,
    colIndex,
    sourceRowIndex = rowIndex,
    sourceColIndex = colIndex,
    align,
    colspan,
    rowspan,
    readonly = false,
    selectedClass,
    dragSource,
    dragOverIndex,
    onContentChange,
    onMouseOver,
    onMouseDown,
    onContextMenu,
  }: Props = $props();

  let cellRef = $state<HTMLElement | null>(null);

  const rowDroppable = createDroppable({
    get id() {
      return `markdown-table-row-drop:${rowIndex}:${colIndex}`;
    },
    accept: MARKDOWN_TABLE_ROW_TYPE,
    get data() {
      return { type: MARKDOWN_TABLE_ROW_TYPE, index: rowIndex };
    },
  });

  const colDroppable = createDroppable({
    get id() {
      return `markdown-table-col-drop:${rowIndex}:${colIndex}`;
    },
    accept: MARKDOWN_TABLE_COL_TYPE,
    get data() {
      return { type: MARKDOWN_TABLE_COL_TYPE, index: colIndex };
    },
  });

  $effect(() => {
    if (!cellRef) {
      return;
    }
    const cleanupRow = rowDroppable.attach(cellRef);
    const cleanupCol = colDroppable.attach(cellRef);
    return () => {
      cleanupRow();
      cleanupCol();
    };
  });
</script>

<Table.Cell
  bind:ref={cellRef}
  onmouseover={onMouseOver}
  onmousedown={onMouseDown}
  oncontextmenu={onContextMenu}
  data-x={sourceColIndex}
  data-y={sourceRowIndex}
  {colspan}
  {rowspan}
  class={cn(
    "relative border-r border-b p-0 text-left",
    selectedClass,
    dropIndicatorClasses(dragSource, dragOverIndex, rowIndex, colIndex),
    dragSource?.type === MARKDOWN_TABLE_COL_TYPE &&
      dragSource.index === colIndex &&
      "is-drag-source is-col-drag-source",
    {
      "text-right": align === "right",
      "text-left": align === "left",
      "text-center": align === "center",
    },
  )}
>
  <ColumnEditor
    {node}
    {onContentChange}
    {readonly}
    class={cn({
      "text-right": align === "right",
      "text-left": align === "left",
      "text-center": align === "center",
    })}
  />
</Table.Cell>
