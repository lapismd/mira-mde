import {
  dropIndicatorClasses as dropIndicatorClassesBase,
  tableColDragType,
  tableRowDragType,
  type TableDragSource,
} from "@lapismd/mira/ui/table-dnd/utils";

export const MARKDOWN_TABLE_ROW_TYPE = tableRowDragType("markdown");
export const MARKDOWN_TABLE_COL_TYPE = tableColDragType("markdown");

export type MarkdownTableDragSource = TableDragSource;

export function dropIndicatorClasses(
  dragSource: MarkdownTableDragSource | null,
  dragOverIndex: number | null,
  rowIndex: number,
  colIndex: number,
): string {
  return dropIndicatorClassesBase(
    dragSource,
    dragOverIndex,
    rowIndex,
    colIndex,
    MARKDOWN_TABLE_ROW_TYPE,
    MARKDOWN_TABLE_COL_TYPE,
  );
}
