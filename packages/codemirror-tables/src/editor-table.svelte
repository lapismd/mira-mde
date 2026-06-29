<script lang="ts">
  // @ts-nocheck
  import { TableNode } from "./table-node";
  import * as Table from "@mira-mde/ui/table";
  import { cn } from "./utils";
  import ColumnEditor from "./editor-column.svelte";
  import * as Tooltip from "@mira-mde/ui/tooltip";
  import Delete from "@lucide/svelte/icons/trash";
  import Elipsis from "@lucide/svelte/icons/ellipsis";
  import * as ContextMenu from "@mira-mde/ui/context-menu";
  import AlignLeft from "@lucide/svelte/icons/align-left";
  import AlignRight from "@lucide/svelte/icons/align-right";
  import AlignCenter from "@lucide/svelte/icons/align-center";
  import * as DropdownMenu from "@mira-mde/ui/dropdown-menu";
  import { Button, buttonVariants } from "@mira-mde/ui/button";
  import { DropdownMenuItem } from "@mira-mde/ui/dropdown-menu";
  import type { AlignType } from "mdast";
  import { Menu } from "./menu";
  import MenuComponent from "./menu-component.svelte";
  import { onMount } from "svelte";
  import * as _ from "lodash-es";
  import { DragDropProvider } from "@dnd-kit/svelte";
  import { tableReorderSensors } from "@mira-mde/ui/table-dnd/sensors";
  import {
    parseTableDragData,
    resolveTableDragTargetIndex,
  } from "@mira-mde/ui/table-dnd/utils";
  import type {
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
  } from "@dnd-kit/dom";
  import MarkdownTableColumnHead from "./markdown-table-column-head.svelte";
  import MarkdownTableDataCell from "./markdown-table-data-cell.svelte";
  import MarkdownTableRowGutterCell from "./markdown-table-row-gutter-cell.svelte";
  import {
    MARKDOWN_TABLE_COL_TYPE,
    MARKDOWN_TABLE_ROW_TYPE,
    type MarkdownTableDragSource,
  } from "./markdown-table-dnd";

  let {
    node,
    onChange = () => {},
    onDelete = () => {},
    onMouseUp = () => {},
    selectedCells = [],
  }: {
    node: TableNode;
    onChange?: (data: string, props?: Record<string, any>) => void;
    onDelete?: (evt: Event) => void;
    onMouseUp?: (evt: MouseEvent) => void;
    selectedCells?: Array<[number, number]>;
  } = $props();
  let tableVersion = $state(0);
  let mdastNode = $derived.by(() => {
    tableVersion;
    return node.getDisplayMdastNode();
  });
  let align = $derived(mdastNode.align ?? []);
  let columnCount = $derived.by(() => {
    tableVersion;
    return node.getColCount();
  });
  let rowCount = $derived.by(() => {
    tableVersion;
    return node.getRowCount();
  });
  let coords: [number, number] = $state([-1, -1]);
  let tableRoot = $state<HTMLElement | null>(null);

  const handleMouseOver = _.debounce((evt: MouseEvent) => {
    onMouseUp(evt);
  }, 100);

  function emitChange(props?: Record<string, any>) {
    node.rerender();
    tableVersion += 1;
    onChange(node.toMarkdown(), props);
  }

  function insertColumn(evt: Event, index: number) {
    node.insertColumnAt(index);
    emitChange();
  }

  function insertColumnAtEnd(evt: Event) {
    evt.stopPropagation();
    insertColumn(evt, node.getColCount());
  }

  function deleteColumn(evt: Event, index: number) {
    node.deleteColumnAt(index);
    emitChange();
  }

  function alignContent(
    evt: Event,
    index: number | number[],
    align: AlignType,
  ) {
    if (Array.isArray(index)) {
      index.forEach((idx) => node.setColumnAlign(idx, align));
    } else {
      node.setColumnAlign(index, align);
    }
    emitChange();
  }

  function insertRow(evt: Event, index: number) {
    node.insertRowAt(index);
    emitChange();
  }

  function deleteRow(evt: Event, index: number) {
    node.deleteRowAt(index);
    emitChange();
  }

  function duplicateRow(evt: Event, index: number) {
    node.duplicateRowAt(index);
    emitChange();
  }

  function duplicateColumn(evt: Event, index: number) {
    node.duplicateColumnAt(index);
    emitChange();
  }

  function moveColumn(evt: Event, index: number, newIndex: number) {
    node.moveColumn(index, newIndex);
    emitChange();
  }

  function moveRow(evt: Event, index: number, newIndex: number) {
    node.moveRow(index, newIndex);
    emitChange();
  }

  function transpose() {
    node.transpose();
    emitChange();
  }

  function sortColumn(index: number, asc: boolean) {
    node.sort(index, asc);
    emitChange();
  }

  function onContentChange(value: string, colIndex: number, rowIndex: number) {
    node.updateCellContents(colIndex, rowIndex, value);
    emitChange();
  }

  function clearCells(cells: [number, number][]) {
    cells.forEach(([row, col]) => {
      node.updateCellContents(col, row, "");
    });
    emitChange();
  }

  function deleteCells(cells: [number, number][]) {
    const { fullRows, fullCols } = fullRowsAndColumns(cells);
    console.log(fullCols);
    if (fullRows.length + fullCols.length > 0) {
      fullRows.forEach((row, i) => node.deleteRowAt(row - i));
      fullCols.forEach((col, i) => node.deleteColumnAt(col - i));
    } else {
      clearCells(cells);
    }
    emitChange();
  }

  function fullRowsAndColumns(selectedCells: [number, number][]) {
    const rowMap: Map<number, Set<number>> = new Map();
    const colMap: Map<number, Set<number>> = new Map();
    for (const [row, col] of selectedCells) {
      if (!rowMap.has(row)) rowMap.set(row, new Set());
      if (!colMap.has(col)) colMap.set(col, new Set());
      rowMap.get(row)!.add(col);
      colMap.get(col)!.add(row);
    }

    const fullRows: number[] = [];
    const fullCols: number[] = [];

    for (const [row, cols] of rowMap.entries()) {
      if (cols.size === node.getColCount()) {
        fullRows.push(row);
      }
    }

    for (const [col, rows] of colMap.entries()) {
      if (rows.size === node.getRowCount()) {
        fullCols.push(col);
      }
    }

    return { fullRows, fullCols };
  }

  function createMenu() {
    const menu = new Menu();

    if (!selected.length) {
      menu
        .addMenu((menu) => {
          menu
            .setTitle("Row")
            .addItem((item) =>
              item
                .setTitle("Add row before")
                .onClick(menuEvent(({ evt, row }) => insertRow(evt, row))),
            )
            .addItem((item) =>
              item
                .setTitle("Add row after")
                .onClick(menuEvent(({ evt, row }) => insertRow(evt, row + 1))),
            )
            .addSeparator()
            .addItem((item) =>
              item
                .setTitle("Move row up")
                .onClick(
                  menuEvent(({ evt, row }) => moveRow(evt, row, row - 1)),
                ),
            )
            .addItem((item) =>
              item
                .setTitle("Move row down")
                .onClick(
                  menuEvent(({ evt, row }) => moveRow(evt, row, row + 1)),
                ),
            )
            .addSeparator()
            .addItem((item) =>
              item
                .setTitle("Duplicate row")
                .onClick(menuEvent(({ evt, row }) => duplicateRow(evt, row))),
            )
            .addItem((item) =>
              item
                .setTitle("Delete row")
                .onClick(menuEvent(({ evt, row }) => deleteRow(evt, row))),
            );
        })
        .addMenu((menu) => {
          menu
            .setTitle("Column")
            .addItem((item) =>
              item
                .setTitle("Add column left")
                .onClick(menuEvent(({ evt, col }) => insertColumn(evt, col))),
            )
            .addItem((item) =>
              item
                .setTitle("Add column right")
                .onClick(
                  menuEvent(({ evt, col }) => insertColumn(evt, col + 1)),
                ),
            )
            .addSeparator()
            .addItem((item) =>
              item
                .setTitle("Move column right")
                .onClick(
                  menuEvent(({ evt, col }) => moveColumn(evt, col, col + 1)),
                ),
            )
            .addItem((item) =>
              item
                .setTitle("Move column left")
                .onClick(
                  menuEvent(({ evt, col }) => moveColumn(evt, col, col - 1)),
                ),
            )
            .addSeparator()
            .addItem((item) =>
              item
                .setTitle("Align left")
                .onClick(
                  menuEvent(({ evt, col }) => alignContent(evt, col, "left")),
                ),
            )
            .addItem((item) =>
              item
                .setTitle("Align center")
                .onClick(
                  menuEvent(({ evt, col }) => alignContent(evt, col, "center")),
                ),
            )
            .addItem((item) =>
              item
                .setTitle("Align right")
                .onClick(
                  menuEvent(({ evt, col }) => alignContent(evt, col, "right")),
                ),
            )
            .addSeparator()
            .addItem((item) =>
              item
                .setTitle("Duplicate column")
                .onClick(
                  menuEvent(({ evt, col }) => duplicateColumn(evt, col)),
                ),
            )
            .addItem((item) =>
              item
                .setTitle("Delete column")
                .onClick(menuEvent(({ evt, col }) => deleteColumn(evt, col))),
            );
        })
        .addSeparator()
        .addItem((item) =>
          item
            .setTitle("Sort by column (A to Z)")
            .onClick(menuEvent(({ evt, col }) => sortColumn(col, true))),
        )
        .addItem((item) =>
          item
            .setTitle("Sort by column (Z to A)")
            .onClick(menuEvent(({ evt, col }) => sortColumn(col, false))),
        )
        .addSeparator()
        .addItem((item) =>
          item.setTitle("Transpose").onClick(() => transpose()),
        )
        .addItem((item) =>
          item.setTitle("Delete").onClick((evt) => onDelete(evt)),
        );
    } else {
      menu
        .addItem((item) =>
          item.setTitle("Delete cells").onClick(() => deleteCells(selected)),
        )
        .addItem((item) =>
          item.setTitle("Clear cells").onClick(() => clearCells(selected)),
        )
        .addSeparator()
        .addItem((item) =>
          item
            .setTitle("Align left")
            .onClick((evt) =>
              alignContent(
                evt,
                [...new Set(selected.map((it) => it[1]))],
                "left",
              ),
            ),
        )
        .addItem((item) =>
          item
            .setTitle("Align center")
            .onClick((evt) =>
              alignContent(
                evt,
                [...new Set(selected.map((it) => it[1]))],
                "center",
              ),
            ),
        )
        .addItem((item) =>
          item
            .setTitle("Align right")
            .onClick((evt) =>
              alignContent(
                evt,
                [...new Set(selected.map((it) => it[1]))],
                "right",
              ),
            ),
        );
    }
    return menu;
  }

  function menuEvent(
    cb: (props: { row: number; col: number; evt: Event }) => void,
  ) {
    return (evt: MouseEvent | KeyboardEvent) => {
      const [row, col] = coords;
      if (row === -1 || col === -1) {
        return;
      }
      cb({ row, col, evt });
      coords = [-1, -1];
    };
  }

  const pos: {
    start: [number, number];
    end: [number, number];
    isMouseDown: boolean;
  } = { start: [-1, -1], end: [-1, -1], isMouseDown: false };
  let selected: Array<[number, number]> = $state([]);

  $effect(() => {
    selected = selectedCells;
  });

  const selectedClasses: Record<string, string> = $derived.by(() => {
    const data: Record<string, string> = {};
    if (!selected.length) {
      return data;
    }
    const start = selected[0];
    const end = selected[selected.length - 1];
    selected.forEach((pos) => {
      const id = pos.join(",");
      const [row, col] = pos;
      const decorations: string[] = ["is-selected"];
      if (row === start[0]) {
        decorations.push(" top ");
      }
      if (col === start[1]) {
        decorations.push(" start ");
      }
      if (row === end[0]) {
        decorations.push(" bottom ");
      }
      if (col === end[1]) {
        decorations.push(" end ");
      }
      data[id] = decorations.join(" ");
    });
    return data;
  });

  function onMouseDown(evt: MouseEvent) {
    if (evt.button === 0) {
      pos.isMouseDown = true;
      setTimeout(() => (selected = []));
      pos.start = getCoords(evt);
      evt.preventDefault();
    }
  }

  function onMouseOver(evt: MouseEvent) {
    if (pos.isMouseDown) {
      pos.end = getCoords(evt);
      selected = getCellsBetween(pos.start, pos.end);
      evt.preventDefault();
    }
  }

  function getCoords(evt: Event): [number, number] {
    let tableCell = evt.target as HTMLElement | null;

    while (tableCell && !["TH", "TD"].includes(tableCell.tagName)) {
      if (tableCell === evt.currentTarget) {
        return [-1, -1];
      }

      tableCell = tableCell.parentElement;
    }
    if (tableCell === null) {
      return [-1, -1];
    }
    const x = tableCell.dataset.x;
    const y = tableCell.dataset.y;
    if (x && y) {
      return [+y, +x];
    }
    const tableRow = tableCell.parentElement!;
    const tableContainer = tableRow.parentElement!;
    const colIndex =
      tableContainer.tagName === "TFOOT"
        ? -1
        : Array.from(tableRow.children).indexOf(tableCell);
    const rowIndex =
      tableCell.tagName === "TH"
        ? -1
        : Array.from(tableRow.parentElement!.children).indexOf(tableRow);

    return [rowIndex, colIndex - 1];
  }

  function getCellsBetween(
    start: [number, number],
    end: [number, number],
  ): [number, number][] {
    const [row1, col1] = start;
    const [row2, col2] = end;

    const minRow = Math.min(row1, row2);
    const maxRow = Math.max(row1, row2);
    const minCol = Math.min(col1, col2);
    const maxCol = Math.max(col1, col2);

    const cells: [number, number][] = [];
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        cells.push([row, col]);
      }
    }
    if (cells.length == 1) {
      return [];
    }
    return cells;
  }

  function selectColumn(evt: Event, column: number) {
    setTimeout(() => {
      selected = Array.from({ length: node.getRowCount() }).map((_, row) => [
        row,
        column,
      ]);
    });
  }

  function selectRow(evt: Event, row: number) {
    setTimeout(() => {
      selected = Array.from({ length: node.getColCount() }).map((_, col) => [
        row,
        col,
      ]);
    });
  }

  let dragSource: MarkdownTableDragSource | null = $state(null);
  let dragOverIndex: number | null = $state(null);

  function commitDrag(type: string, start: number, end: number) {
    if (start !== end) {
      if (type === MARKDOWN_TABLE_COL_TYPE) {
        node.moveColumn(start, end);
        selectColumn(new Event("select"), end);
      } else if (type === MARKDOWN_TABLE_ROW_TYPE) {
        node.moveRow(start, end);
        selectRow(new Event("select"), end);
      }
      emitChange({
        selectedCells:
          type === MARKDOWN_TABLE_COL_TYPE
            ? Array.from({ length: node.getRowCount() }).map((_, row) => [
                row,
                end,
              ])
            : Array.from({ length: node.getColCount() }).map((_, col) => [
                end,
                col,
              ]),
      });
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const target = parseTableDragData(
      event.operation.target,
      MARKDOWN_TABLE_ROW_TYPE,
      MARKDOWN_TABLE_COL_TYPE,
    );
    if (
      target &&
      dragSource &&
      target.type === dragSource.type &&
      target.index !== dragSource.index
    ) {
      dragOverIndex = target.index;
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const data = parseTableDragData(
      event.operation.source,
      MARKDOWN_TABLE_ROW_TYPE,
      MARKDOWN_TABLE_COL_TYPE,
    );
    if (!data) {
      return;
    }
    dragSource = { type: data.type, index: data.index };
    if (data.type === MARKDOWN_TABLE_COL_TYPE) {
      selectColumn(new Event("select"), data.index);
    } else {
      selectRow(new Event("select"), data.index);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const source = parseTableDragData(
      event.operation.source,
      MARKDOWN_TABLE_ROW_TYPE,
      MARKDOWN_TABLE_COL_TYPE,
    );
    const targetIndex = resolveTableDragTargetIndex(
      event,
      dragOverIndex,
      MARKDOWN_TABLE_ROW_TYPE,
      MARKDOWN_TABLE_COL_TYPE,
    );
    if (source && targetIndex !== null) {
      commitDrag(source.type, source.index, targetIndex);
    }
    dragSource = null;
    dragOverIndex = null;
  }

  onMount(() => {
    const fn = (evt: MouseEvent) => {
      if (!pos.isMouseDown && selected.length && evt.button === 0) {
        setTimeout(() => (selected = []));
      }
      pos.isMouseDown = false;
      onMouseUp(evt);
    };

    document.addEventListener("mouseup", fn);
    document.addEventListener("mouseover", handleMouseOver);
    return () => {
      document.removeEventListener("mouseup", fn);
      document.removeEventListener("mouseover", handleMouseOver);
    };
  });
</script>

<DragDropProvider
  sensors={tableReorderSensors}
  onDragStart={handleDragStart}
  onDragOver={handleDragOver}
  onDragEnd={handleDragEnd}
>
  <ContextMenu.Root>
    <ContextMenu.Trigger class="relative">
      {#key tableVersion}
        <Table.Root
          bind:ref={tableRoot}
          class={cn(
            "cm-table-widget h-full w-fit",
            dragSource && "is-table-chrome-dragging",
          )}
          className="overflow-x-auto overflow-y-hidden"
        >
          <colgroup>
            <col />
            {#each mdastNode.children[0].children as _, index}
              <col
                class={cn("text-left", {
                  "text-right": align[index] === "right",
                  "text-left": align[index] === "left",
                  "text-center": align[index] === "center",
                })}
              />
            {/each}
            <col />
          </colgroup>
          <Table.Header>
            <Table.Row
              class="group border-none hover:[&,&>svelte-css-wrapper]:[&>th,td]:bg-transparent"
            >
              <Table.Head class="h-5 border-none p-0">
                <div
                  class="markdown-table-chrome absolute top-0 z-10 flex items-center opacity-0 group-hover:opacity-100"
                  data-markdown-table-chrome="delete-table"
                >
                  <Tooltip.Provider>
                    <Tooltip.Root>
                      <Tooltip.Trigger
                        class={buttonVariants({
                          variant: "ghost",
                          size: "xs",
                          class: "h-5 w-5 p-0",
                        })}
                        onclick={(evt) => onDelete(evt)}
                      >
                        <Delete />
                      </Tooltip.Trigger>
                      <Tooltip.Content side="right"
                        >Delete table</Tooltip.Content
                      >
                    </Tooltip.Root>
                  </Tooltip.Provider>
                </div>
              </Table.Head>
              {#each mdastNode.children[0].children as col, index}
                <MarkdownTableColumnHead
                  {index}
                  {dragSource}
                  {dragOverIndex}
                  onSelectColumn={(evt) => selectColumn(evt, index)}
                >
                  {@render columnMenu({ index })}
                </MarkdownTableColumnHead>
              {/each}
              <Table.Head class="group h-5 w-5 border-none"></Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each mdastNode.children as row, rowIndex}
              <Table.Row class={cn("group border-none")}>
                <MarkdownTableRowGutterCell
                  {rowIndex}
                  colIndex={0}
                  {dragSource}
                  {dragOverIndex}
                  onSelectRow={(evt) => selectRow(evt, rowIndex)}
                  onInsertRow={insertRow}
                  onDeleteRow={deleteRow}
                />
                {#each row.children as col, index}
                  {@const hProperties = col.data?.hProperties ?? {}}
                  {@const sourceRowIndex =
                    hProperties.sourceRowIndex ?? rowIndex}
                  {@const sourceColIndex = hProperties.sourceColIndex ?? index}
                  {@const displayColIndex =
                    hProperties.displayColIndex ?? index}
                  {@const id = [sourceRowIndex, sourceColIndex].join(",")}
                  <MarkdownTableDataCell
                    node={col}
                    {rowIndex}
                    colIndex={displayColIndex}
                    {sourceRowIndex}
                    {sourceColIndex}
                    align={align[displayColIndex]}
                    colspan={col.data?.hProperties?.colSpan}
                    rowspan={col.data?.hProperties?.rowSpan}
                    selectedClass={selectedClasses[id]}
                    {dragSource}
                    {dragOverIndex}
                    onContentChange={(value) =>
                      onContentChange(value, sourceColIndex, sourceRowIndex)}
                    {onMouseOver}
                    {onMouseDown}
                    onContextMenu={() =>
                      (coords = [sourceRowIndex, sourceColIndex])}
                  />
                {/each}
                {#if rowIndex === 0}
                  <Table.Cell
                    rowspan={rowCount}
                    class="markdown-table-chrome markdown-table-chrome--edge-cell bg-background group-hover:bg-background w-5 p-0 group-hover:border-y group-hover:border-r"
                    data-markdown-table-chrome="add-col"
                  >
                    <button
                      type="button"
                      data-slot="button"
                      aria-label="Add column"
                      class={buttonVariants({
                        variant: "ghost",
                        size: "sm",
                        class:
                          "markdown-table-chrome h-full w-5 cursor-e-resize rounded-none opacity-0 group-hover:opacity-100 [&_svg]:size-6",
                      })}
                      onclickcapture={insertColumnAtEnd}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        ><path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M9.70775 4.025C9.35775 4.375 9.18275 4.80258 9.18275 5.30775V6.5H10.6827V5.30775C10.6827 5.21792 10.7116 5.14417 10.7693 5.0865C10.8269 5.02883 10.9007 5 10.9905 5H15.6923C15.7821 5 15.8558 5.02883 15.9135 5.0865C15.9712 5.14417 16 5.21792 16 5.30775V18.6923C16 18.7821 15.9712 18.8558 15.9135 18.9135C15.8558 18.9712 15.7821 19 15.6923 19H10.9905C10.9007 19 10.8269 18.9712 10.7693 18.9135C10.7116 18.8558 10.6827 18.7821 10.6827 18.6923V17.6923H9.18275V18.6923C9.18275 19.1974 9.35775 19.625 9.70775 19.975C10.0577 20.325 10.4853 20.5 10.9905 20.5H15.6923C16.1974 20.5 16.625 20.325 16.975 19.975C17.325 19.625 17.5 19.1974 17.5 18.6923V5.30775C17.5 4.80258 17.325 4.375 16.975 4.025C16.625 3.675 16.1974 3.5 15.6923 3.5H10.9905C10.4853 3.5 10.0577 3.675 9.70775 4.025Z"
                          fill="currentColor"
                        ></path><path
                          d="M9.18275 11.3848H7V12.8848H9.18275V15H10.6827V12.8848H12.7307V11.3848H10.6827V9.26925H9.18275V11.3848Z"
                          fill="currentColor"
                        ></path></svg
                      >
                    </button>
                  </Table.Cell>
                {/if}
              </Table.Row>
            {/each}
          </Table.Body>
          <Table.Footer class="border-t-0 bg-transparent">
            <Table.Row class="group border-none p-0 hover:bg-transparent">
              <Table.Head class="h-5 !bg-transparent"></Table.Head>
              <Table.Head
                colspan={columnCount}
                class="markdown-table-chrome markdown-table-chrome--footer-cell group m-0 h-5 p-0 group-hover:border-x group-hover:border-b"
              >
                <div
                  class="markdown-table-chrome flex items-center opacity-0 group-hover:opacity-100"
                  data-markdown-table-chrome="add-row"
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    class="h-5 w-full cursor-s-resize rounded-none  [&_svg]:size-6"
                    onclick={(evt) => insertRow(evt, node.getRowCount())}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      ><path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M4.025 10.2077C4.375 9.85775 4.80258 9.68275 5.30775 9.68275H6.5V11.1827H5.30775C5.21792 11.1827 5.14417 11.2116 5.0865 11.2693C5.02883 11.3269 5 11.4007 5 11.4905V16.1923C5 16.2821 5.02883 16.3558 5.0865 16.4135C5.14417 16.4712 5.21792 16.5 5.30775 16.5H18.6923C18.7821 16.5 18.8558 16.4712 18.9135 16.4135C18.9712 16.3558 19 16.2821 19 16.1923V11.4905C19 11.4007 18.9712 11.3269 18.9135 11.2693C18.8558 11.2116 18.7821 11.1827 18.6923 11.1827H17.6923V9.68275H18.6923C19.1974 9.68275 19.625 9.85775 19.975 10.2077C20.325 10.5577 20.5 10.9853 20.5 11.4905V16.1923C20.5 16.6974 20.325 17.125 19.975 17.475C19.625 17.825 19.1974 18 18.6923 18H5.30775C4.80258 18 4.375 17.825 4.025 17.475C3.675 17.125 3.5 16.6974 3.5 16.1923V11.4905C3.5 10.9853 3.675 10.5577 4.025 10.2077Z"
                        fill="currentColor"
                      ></path><path
                        d="M11.3848 9.68275V7.5H12.8848V9.68275H15V11.1827H12.8848V13.2307H11.3848V11.1827H9.26925V9.68275H11.3848Z"
                        fill="currentColor"
                      ></path></svg
                    >
                  </Button>
                </div>
              </Table.Head>
              <Table.Head class="h-5 !bg-transparent"></Table.Head>
            </Table.Row>
          </Table.Footer>
        </Table.Root>
      {/key}
    </ContextMenu.Trigger>
    <MenuComponent menu={createMenu()} />
  </ContextMenu.Root>
</DragDropProvider>

{#snippet columnMenu({ index }: { index: number })}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger
      class={buttonVariants({
        variant: "ghost",
        size: "xs",
        class:
          "markdown-table-chrome h-5 w-5 rounded-full p-0 opacity-40 group-hover:opacity-100",
      })}
    >
      <Elipsis />
    </DropdownMenu.Trigger>
    <DropdownMenu.Content class="flex">
      <DropdownMenuItem
        disabled={node.__mdastNode.align?.[index] === "left"}
        class="[&_svg]:size-5"
        onclick={(evt) => alignContent(evt, index, "left")}
        ><AlignLeft /></DropdownMenuItem
      >
      <DropdownMenuItem
        disabled={node.__mdastNode.align?.[index] === "center"}
        class="[&_svg]:size-5"
        onclick={(evt) => alignContent(evt, index, "center")}
        ><AlignCenter /></DropdownMenuItem
      >
      <DropdownMenuItem
        disabled={node.__mdastNode.align?.[index] === "right"}
        class="[&_svg]:size-5"
        onclick={(evt) => alignContent(evt, index, "right")}
        ><AlignRight /></DropdownMenuItem
      >
      <DropdownMenuItem
        title="Insert a column to the left of this one"
        class="[&_svg]:size-5"
        onclick={(evt) => {
          insertColumn(evt, index);
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          ><path
            d="M10.8075 20.1152H15.1305H15.0537H15.1152H10.8075ZM16.6152 19.8075C16.6152 20.3127 16.4402 20.7402 16.0902 21.0902C15.7402 21.4402 15.3127 21.6152 14.8075 21.6152H11.1152C10.6101 21.6152 10.1825 21.4402 9.83248 21.0902C9.48248 20.7402 9.30748 20.3127 9.30748 19.8075V10.423H10.8075V19.8075C10.8075 19.8973 10.8363 19.9711 10.894 20.0287C10.9517 20.0864 11.0254 20.1152 11.1152 20.1152H14.8075C14.8973 20.1152 14.9711 20.0864 15.0287 20.0287C15.0864 19.9711 15.1152 19.8973 15.1152 19.8075V4.69223C15.5434 4.74357 15.9004 4.93299 16.1862 5.26048C16.4722 5.58798 16.6152 5.97548 16.6152 6.42298V19.8075ZM10.8075 2.49998V4.61523H12.923V6.11523H10.8075V8.23073H9.30748V6.11523H7.19223V4.61523H9.30748V2.49998H10.8075Z"
            fill="currentColor"
          ></path></svg
        >
      </DropdownMenuItem>
      <DropdownMenuItem
        title="Insert a column to the right of this one"
        class="[&_svg]:size-5"
        onclick={(evt) => {
          insertColumn(evt, index + 1);
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          ><path
            d="M13.0001 20.1152H8.67713H8.75388H8.69238H13.0001ZM7.19238 19.8075C7.19238 20.3127 7.36738 20.7402 7.71738 21.0902C8.06738 21.4402 8.49497 21.6152 9.00013 21.6152H12.6924C13.1975 21.6152 13.6251 21.4402 13.9751 21.0902C14.3251 20.7402 14.5001 20.3127 14.5001 19.8075V10.423H13.0001V19.8075C13.0001 19.8973 12.9713 19.9711 12.9136 20.0287C12.856 20.0864 12.7822 20.1152 12.6924 20.1152H9.00013C8.9103 20.1152 8.83655 20.0864 8.77888 20.0287C8.72122 19.9711 8.69238 19.8973 8.69238 19.8075V4.69223C8.26422 4.74357 7.90722 4.93299 7.62138 5.26048C7.33538 5.58798 7.19238 5.97548 7.19238 6.42298V19.8075ZM13.0001 2.49998V4.61523H10.8846V6.11523H13.0001V8.23073H14.5001V6.11523H16.6154V4.61523H14.5001V2.49998H13.0001Z"
            fill="currentColor"
          ></path></svg
        >
      </DropdownMenuItem>
      <DropdownMenuItem
        title="Delete column"
        class="[&_svg]:size-5"
        onclick={(evt) => {
          deleteColumn(evt, index);
        }}><Delete /></DropdownMenuItem
      >
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/snippet}
