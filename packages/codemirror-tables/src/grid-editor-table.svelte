<script lang="ts">
  // @ts-nocheck
  import { GridTableNode, type ColType } from "./grid-table";
  import * as Table from "@mira-mde/ui/table";
  import { cn } from "./utils";
  import ColumnEditor from "./grid-editor-column.svelte";
  import * as Tooltip from "@mira-mde/ui/tooltip";
  import Delete from "@lucide/svelte/icons/trash";
  import Elipsis from "@lucide/svelte/icons/ellipsis";
  import * as ContextMenu from "@mira-mde/ui/context-menu";
  import AlignLeft from "@lucide/svelte/icons/align-left";
  import AlignRight from "@lucide/svelte/icons/align-right";
  import AlignCenter from "@lucide/svelte/icons/align-center";
  import AlignJustify from "@lucide/svelte/icons/align-justify";
  import GripHorizontal from "@lucide/svelte/icons/grip-horizontal";
  import GripVertical from "@lucide/svelte/icons/grip-vertical";

  import * as DropdownMenu from "@mira-mde/ui/dropdown-menu";
  import { Button, buttonVariants } from "@mira-mde/ui/button";
  import { DropdownMenuItem } from "@mira-mde/ui/dropdown-menu";
  import type { GridAlignType, GridVerticalAlignType } from "mdast";
  import { Menu } from "./menu";
  import MenuComponent from "./menu-component.svelte";
  import { onMount } from "svelte";
  import { debounce } from "lodash-es";

  let {
    node,
    onChange = () => {},
    onDelete = () => {},
    onMouseUp = () => {},
    selectedCells = [],
  }: {
    node: GridTableNode;
    onChange?: (data: string, props?: Record<string, any>) => void;
    onDelete?: (evt: Event) => void;
    onMouseUp?: (evt: MouseEvent) => void;
    selectedCells?: Array<[number, number]>;
  } = $props();
  let tableVersion = $state(0);
  let columnCount = $derived.by(() => {
    tableVersion;
    return node.getColCount();
  });
  let rowCount = $derived.by(() => {
    tableVersion;
    return node.getRowCount();
  });
  let gridRows = $derived.by(() => {
    tableVersion;
    return node.getRows();
  });
  let coords: [number, number] = $state([-1, -1]);

  const handleMouseOver = debounce((evt: MouseEvent) => {
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
    coords: { x: number; y: number } | Array<{ x: number; y: number }>,
    align: { align?: GridAlignType; valign?: GridVerticalAlignType },
  ) {
    node.setColumnAlign(coords, align);
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

    if (!selected.selected.length) {
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
            .addMenu((menu) => {
              menu
                .setTitle("Align")
                .addItem((item) =>
                  item
                    .setTitle("Left")
                    .onClick(
                      menuEvent(({ evt, col, row }) =>
                        alignContent(
                          evt,
                          { x: col, y: row },
                          { align: "left" },
                        ),
                      ),
                    ),
                )
                .addItem((item) =>
                  item
                    .setTitle("Center")
                    .onClick(
                      menuEvent(({ evt, col, row }) =>
                        alignContent(
                          evt,
                          { x: col, y: row },
                          { align: "center" },
                        ),
                      ),
                    ),
                )
                .addItem((item) =>
                  item
                    .setTitle("Right")
                    .onClick(
                      menuEvent(({ evt, col, row }) =>
                        alignContent(
                          evt,
                          { x: col, y: row },
                          { align: "right" },
                        ),
                      ),
                    ),
                )
                .addItem((item) =>
                  item
                    .setTitle("Justify")
                    .onClick(
                      menuEvent(({ evt, col, row }) =>
                        alignContent(
                          evt,
                          { x: col, y: row },
                          { align: "justify" },
                        ),
                      ),
                    ),
                );
            })
            .addMenu((menu) => {
              menu
                .setTitle("Vertical Align")
                .addItem((item) =>
                  item
                    .setTitle("Top")
                    .onClick(
                      menuEvent(({ evt, col, row }) =>
                        alignContent(
                          evt,
                          { x: col, y: row },
                          { valign: "top" },
                        ),
                      ),
                    ),
                )
                .addItem((item) =>
                  item
                    .setTitle("Middle")
                    .onClick(
                      menuEvent(({ evt, col, row }) =>
                        alignContent(
                          evt,
                          { x: col, y: row },
                          { valign: "middle" },
                        ),
                      ),
                    ),
                )
                .addItem((item) =>
                  item
                    .setTitle("Bottom")
                    .onClick(
                      menuEvent(({ evt, col, row }) =>
                        alignContent(
                          evt,
                          { x: col, y: row },
                          { valign: "bottom" },
                        ),
                      ),
                    ),
                );
            })
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
          item.setTitle("Delete").onClick((evt) => onDelete(evt)),
        );
    } else {
      const selectedCells = selected.selected.map(([y, x]) => ({ y, x }));
      menu
        .addItem((item) =>
          item
            .setTitle("Delete cells")
            .onClick(() => deleteCells(selected.selected)),
        )
        .addItem((item) =>
          item
            .setTitle("Clear cells")
            .onClick(() => clearCells(selected.selected)),
        )
        .addSeparator()
        .addMenu((menu) => {
          menu
            .setTitle("Align")
            .addItem((item) =>
              item.setTitle("Left").onClick((evt) =>
                alignContent(
                  evt,
                  selected.selected.map(([y, x]) => ({ y, x })),
                  { align: "left" },
                ),
              ),
            )
            .addItem((item) =>
              item.setTitle("Center").onClick((evt) =>
                alignContent(
                  evt,
                  selected.selected.map(([y, x]) => ({ y, x })),
                  { align: "center" },
                ),
              ),
            )
            .addItem((item) =>
              item.setTitle("Right").onClick((evt) =>
                alignContent(
                  evt,
                  selected.selected.map(([y, x]) => ({ y, x })),
                  { align: "right" },
                ),
              ),
            )
            .addItem((item) =>
              item.setTitle("Justify").onClick((evt) =>
                alignContent(
                  evt,
                  selected.selected.map(([y, x]) => ({ y, x })),
                  { align: "justify" },
                ),
              ),
            );
        })
        .addMenu((menu) => {
          menu
            .setTitle("Vertical Align")
            .addItem((item) =>
              item
                .setTitle("Top")
                .onClick((evt) =>
                  alignContent(evt, selectedCells, { valign: "top" }),
                ),
            )
            .addItem((item) =>
              item
                .setTitle("Middle")
                .onClick((evt) =>
                  alignContent(evt, selectedCells, { valign: "middle" }),
                ),
            )
            .addItem((item) =>
              item
                .setTitle("Bottom")
                .onClick((evt) =>
                  alignContent(evt, selectedCells, { valign: "bottom" }),
                ),
            );
        });
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
  let selected: {
    selected: [number, number][];
    spans: [number, number][];
  } = $state({
    selected: [],
    spans: [],
  });

  $effect(() => {
    selected = {
      selected: selectedCells,
      spans: [],
    };
  });

  const selectedClasses: Record<string, string> = $derived.by(() => {
    const data: Record<string, string> = {};
    const selections = [...selected.selected, ...selected.spans].sort((a, b) =>
      a.join(",").localeCompare(b.join(",")),
    );

    const selectedMap: Set<string> = new Set(
      selections.map((it) => it.join(",")),
    );

    const y = selections.map((it) => it[0]);
    const x = selections.map((it) => it[1]);

    const coordMin: [number, number] = [Math.min(...y), Math.min(...x)];
    const coordMax: [number, number] = [Math.max(...y), Math.max(...x)];
    const cells =
      selections.length > 1
        ? getCellsBetween(coordMin, coordMax).filter((coords) => {
            const id = coords.join(",");
            return !selectedMap.has(id);
          })
        : [];

    if (!selections.length) {
      return data;
    }

    selections.forEach((pos) => {
      const id = pos.join(",");
      const [row, col] = pos;
      const decorations: string[] = ["is-selected"];
      if (row === coordMin[0]) {
        decorations.push("top");
      }
      if (col == coordMin[1]) {
        decorations.push("start");
      }
      if (row === coordMax[0]) {
        decorations.push("bottom");
      }
      if (col === coordMax[1]) {
        decorations.push("end");
      }
      data[id] = decorations.join(" ").trim();
    });

    const ext: Record<string, string> = {};
    cells.forEach((coords) => {
      const decorations: string[] = [];

      const [y, x] = coords;
      const id = coords.join(",");

      // bottom
      let check = `${y + 1},${x}`;
      if (data[check] && !data[check].includes("top")) {
        decorations.push("is-selected", "is-partial", "bottom");
      }

      // top
      check = `${y - 1},${x}`;
      if (data[check] && !data[check].includes("bottom")) {
        decorations.push("is-selected", "is-partial", "top");
      }

      // end
      check = `${y},${x + 1}`;
      if (data[check] && !data[check].includes("start")) {
        decorations.push("is-selected", "is-partial", "end");
      }

      // start
      check = `${y},${x - 1}`;
      if (data[check] && !data[check].includes("end")) {
        decorations.push("is-selected", "is-partial", "start");
      }

      ext[id] = [...new Set(decorations)].join(" ").trim();
    });

    return { ...data, ...ext };
  });

  function onMouseDown(evt: MouseEvent) {
    if (evt.button === 0) {
      pos.isMouseDown = true;
      if (!(evt.ctrlKey || evt.metaKey)) {
        setTimeout(() => (selected = { selected: [], spans: [] }));
      }
      pos.start = getCoords(evt);
      evt.preventDefault();
    }
  }

  function onMouseOver(evt: MouseEvent) {
    if (pos.isMouseDown) {
      pos.end = getCoords(evt);
      const cells = getCellsBetween(pos.start, pos.end);
      selected = getSelection(cells);
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
    if (!tableCell) {
      return [-1, -1];
    }

    const x = tableCell.dataset.x;
    const y = tableCell.dataset.y;
    if (x && y) {
      return [+y, +x];
    }
    return [-1, -1];
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

  function getSelection(cells: [number, number][]) {
    const cellMap = new Set(cells.map((it) => it.join(",")));
    const spanedCells: [number, number][] = [];
    for (const [y, x] of cells) {
      const cell = node.cellAt({ x, y });
      if (cell && cell.coords.length > 1) {
        cell.coords.forEach((coord) => {
          const id = `${coord.y},${coord.x}`;
          if (!cellMap.has(id)) {
            spanedCells.push([coord.y, coord.x]);
            cellMap.add(id);
          }
        });
      }
    }

    return {
      selected: cells,
      spans: spanedCells,
    };
  }

  function columnsFor(x: number) {
    const selections: [number, number][] = [];
    for (let y = 0; y < node.getRowCount(); y++) {
      const cell = node.cellAt({ y, x });
      if (!cell) continue;
      selections.push([cell.y, cell.x]);
    }
    return selections;
  }

  function selectColumn(evt: Event, x: number) {
    setTimeout(() => {
      selected = getSelection(columnsFor(x));
    });
  }

  function rowsFor(y: number) {
    const selections: [number, number][] = [];
    for (let x = 0; x < columnCount; x++) {
      const cell = node.cellAt({ y, x });
      if (!cell) continue;
      selections.push([cell.y, cell.x]);
    }
    return selections;
  }

  function selectRow(evt: Event, y: number) {
    setTimeout(() => {
      selected = getSelection(rowsFor(y));
    });
  }

  let dragState: { start: number; end: number; type: "row" | "col" } = $state({
    start: -1,
    end: -1,
    type: "col",
  });

  function dragStart(event: DragEvent, index: number, type: "row" | "col") {
    if (!event.dataTransfer) {
      return;
    }
    dragState = { ...dragState, start: index, type };
    event.dataTransfer.setData("text/plain", index.toString());
    type === "col" ? selectColumn(event, index) : selectRow(event, index);
  }

  function dragEnd(event: DragEvent) {
    if (dragState.start !== dragState.end) {
      if (dragState.type === "col") {
        node.moveColumn(dragState.start, dragState.end);
        selectColumn(event, dragState.end);
      } else {
        node.moveRow(dragState.start, dragState.end);
        selectRow(event, dragState.end);
      }
      const selections: [number, number][] =
        dragState.type === "col"
          ? columnsFor(dragState.end)
          : rowsFor(dragState.end);
      selected = getSelection(selections);
      emitChange({
        selectedCells: selected.selected,
      });
    }
    dragState = { start: -1, end: -1, type: "col" };
  }

  onMount(() => {
    const fn = (evt: MouseEvent) => {
      if (!pos.isMouseDown && selected.selected.length && evt.button === 0) {
        setTimeout(() => (selected = { selected: [], spans: [] }));
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

  function dragSelection(cell: ColType) {
    return cell.coords
      .map((coord) => {
        return selectedClasses[`${coord.y},${coord.x}`];
      })
      .filter((it) => it && it.length)
      .join(" ")
      .trim();
  }

  function handleEdit(evt: MouseEvent, cell: ColType) {
    if (!(evt.metaKey || evt.ctrlKey)) return true;
    const cellMap = new Set(selected.selected.map((it) => it.join(",")));
    const id = `${cell.y},${cell.x}`;
    if (cellMap.has(id)) {
      selected = getSelection(
        selected.selected.filter(([y, x]) => !(y === cell.y && x === cell.x)),
      );
    } else {
      selected = getSelection([...selected.selected, [cell.y, cell.x]]);
    }
    return false;
  }
</script>

<ContextMenu.Root>
  <ContextMenu.Trigger class="group/trigger relative">
    {#key tableVersion}
      <Table.Root
        class={cn(
          "cm-table-widget h-full w-fit",
          dragState.start !== -1 && "is-table-chrome-dragging",
        )}
        className="overflow-x-auto overflow-y-hidden"
      >
        <Table.Header>
          <Table.Row
            class="group border-none hover:[&,&>svelte-css-wrapper]:[&>th,td]:bg-transparent"
          >
            <Table.Head class="h-5 border-none p-0">
              <div
                class="markdown-table-chrome absolute top-0 z-10 flex items-center opacity-0 group-hover/trigger:opacity-100"
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
                      onclick={(evt: MouseEvent) => onDelete(evt)}
                    >
                      <Delete />
                    </Tooltip.Trigger>
                    <Tooltip.Content side="right">Delete table</Tooltip.Content>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>
            </Table.Head>
            {#each { length: columnCount } as _, index}
              <Table.Head
                class="markdown-table-chrome markdown-table-chrome--cell group relative h-5 border-b p-0 opacity-0 group-hover/trigger:opacity-100"
                data-markdown-table-chrome="col-header"
                ondragenter={() => (dragState.end = index)}
              >
                <Button
                  ondragend={(evt) => dragEnd(evt)}
                  ondragstart={(evt) => dragStart(evt, index, "col")}
                  draggable="true"
                  variant="ghost"
                  size="xs"
                  data-grab-handle=""
                  data-markdown-table-drag-handle="col"
                  data-markdown-table-drag-index={index}
                  class="markdown-table-chrome markdown-table-chrome--drag-handle absolute bottom-[-8px] left-[calc(50%-0.75rem_/_2)] z-10 hidden cursor-grab group-hover:inline-flex"
                  onclick={(evt) => selectColumn(evt, index)}
                >
                  <GripHorizontal />
                </Button>
                <div class="flex justify-end">
                  {@render columnMenu({ index })}
                </div>
              </Table.Head>
            {/each}
            <Table.Head class="group h-5 w-5 border-none"></Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {@render tableRows({ type: "gtBody", Component: Table.Cell })}
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

{#snippet tableRows({
  Component,
  type,
}: {
  Component: any;
  type: "gtBody" | "gtHeader" | "gtFooter";
})}
  {#each gridRows as row, rowIndex}
    <Table.Row class={cn("group border-none")}>
      <Component
        class="markdown-table-chrome markdown-table-chrome--gutter-cell relative w-[2rem] border-r p-0 opacity-0 group-hover:border-y group-hover:border-l group-hover/trigger:opacity-100"
        data-markdown-table-chrome="row-gutter"
      >
        <Button
          ondragend={(evt) => dragEnd(evt)}
          ondragstart={(evt) => dragStart(evt, rowIndex, "row")}
          draggable="true"
          variant="ghost"
          size="xs"
          data-grab-handle=""
          data-markdown-table-drag-handle="row"
          data-markdown-table-drag-index={rowIndex}
          class="markdown-table-chrome markdown-table-chrome--drag-handle absolute top-1/2 right-[-0.5rem] z-10 cursor-grab opacity-0 group-hover:opacity-100"
          onclick={(evt) => selectRow(evt, rowIndex)}
        >
          <GripVertical />
        </Button>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger
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
              data-tooltip="Insert a row above this one"
              class="[&_svg]:size-5"
              onclick={(evt: MouseEvent) => insertRow(evt, rowIndex)}
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
              data-tooltip="Insert a row below this one"
              class="[&_svg]:size-5"
              onclick={(evt: MouseEvent) => insertRow(evt, rowIndex + 1)}
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
              data-tooltip="Delete row"
              class="[&_svg]:size-5"
              onclick={(evt: MouseEvent) => deleteRow(evt, rowIndex)}
              ><Delete /></DropdownMenuItem
            >
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Component>
      {#each row.cells as cell, index}
        {@const id = [cell.y, cell.x].join(",")}
        <Component
          colspan={cell.cell.colSpan}
          rowspan={cell.cell.rowSpan}
          data-x={cell.x}
          data-y={cell.y}
          data-align={cell.cell.align}
          data-valign={cell.cell.valign ?? "middle"}
          onmouseover={(evt: MouseEvent) => onMouseOver(evt)}
          onmousedown={(evt: MouseEvent) => onMouseDown(evt)}
          oncontextmenu={() => (coords = [cell.y, cell.x])}
          ondragenter={() =>
            (dragState.end = dragState.type === "col" ? cell.x : cell.y)}
          class={cn("border-r border-b p-0", dragSelection(cell), {
            "is-dragging-right":
              dragState.type === "col" &&
              cell.x === dragState.end &&
              cell.x > dragState.start,
            "is-dragging-left":
              dragState.type === "col" &&
              cell.x === dragState.end &&
              cell.x < dragState.start,
            "is-dragging-bottom":
              dragState.type === "row" &&
              cell.y === dragState.end &&
              cell.y > dragState.start,
            "is-dragging-top":
              dragState.type === "row" &&
              cell.y === dragState.end &&
              cell.y < dragState.start,
          })}
        >
          <ColumnEditor
            content={cell.cell.content}
            class={cn({
              "text-left": cell.cell.align === "left",
              "text-center": cell.cell.align === "center",
              "text-right": cell.cell.align === "right",
              "text-justify": cell.cell.align === "justify",
            })}
            onContentChange={(value) => onContentChange(value, cell.x, cell.y)}
            onEdit={(evt: MouseEvent) => handleEdit(evt, cell)}
          />
        </Component>
      {/each}
      {#if rowIndex === 0}
        <Component
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
        </Component>
      {/if}
    </Table.Row>
  {/each}
{/snippet}

{#snippet columnMenu({ index }: { index: number })}
  {@const columns = columnsFor(index).map(([y, x]) => ({ x, y }))}
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
        data-tooltip="Align Left"
        class="[&_svg]:size-5"
        onclick={(evt: MouseEvent) =>
          alignContent(evt, columns, { align: "left" })}
        ><AlignLeft /></DropdownMenuItem
      >
      <DropdownMenuItem
        data-tooltip="Align Center"
        class="[&_svg]:size-5"
        onclick={(evt: MouseEvent) =>
          alignContent(evt, columns, { align: "center" })}
        ><AlignCenter /></DropdownMenuItem
      >
      <DropdownMenuItem
        data-tooltip="Align Right"
        class="[&_svg]:size-5"
        onclick={(evt: MouseEvent) =>
          alignContent(evt, columns, { align: "right" })}
        ><AlignRight /></DropdownMenuItem
      >
      <DropdownMenuItem
        data-tooltip="Align Justify"
        class="[&_svg]:size-5"
        onclick={(evt: MouseEvent) =>
          alignContent(evt, columns, { align: "justify" })}
        ><AlignJustify /></DropdownMenuItem
      >
      <DropdownMenuItem
        data-tooltip="Insert a column to the left of this one"
        class="[&_svg]:size-5"
        onclick={(evt: MouseEvent) => {
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
        data-tooltip="Insert a column to the right of this one"
        class="[&_svg]:size-5"
        onclick={(evt: MouseEvent) => {
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
        data-tooltip="Delete column"
        class="[&_svg]:size-5"
        onclick={(evt: MouseEvent) => {
          deleteColumn(evt, index);
        }}><Delete /></DropdownMenuItem
      >
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/snippet}
