export * from "./extension";
export * from "./pipe-table";
export * from "./types";
export * from "./widgets/grid-table-widget";
export * from "./widgets/pipe-table-widget";
export { GridTableNode, type ColType, type GridType, type RowType } from "./grid-table";
export { $convertTableElement, TableNode } from "./table-node";

import EditorColumn from "./editor-column.svelte";
import EditorTable from "./editor-table.svelte";
import GridEditorColumn from "./grid-editor-column.svelte";
import GridEditorTable from "./grid-editor-table.svelte";

export {
  EditorColumn,
  EditorColumn as column,
  EditorTable,
  EditorTable as Table,
  GridEditorColumn,
  GridEditorColumn as GridColumn,
  GridEditorTable,
  GridEditorTable as GridTable,
};
