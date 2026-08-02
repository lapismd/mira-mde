export const TYPE_TABLE = "gridTable";
export const TYPE_HEADER = "gtHeader";
export const TYPE_BODY = "gtBody";
export const TYPE_FOOTER = "gtFooter";
export const TYPE_ROW = "gtRow";
export const TYPE_CELL = "gtCell";
export const TYPE_ROW_LINE = "gtRowLine";
export const TYPE_GRID_DIVIDER = "gtGridDivider";

export type MarkdownTable = {
  header: string[];
  align: Array<"left" | "center" | "right" | null>;
  rows: string[][];
};

export type MarkdownTableWidgetOptions = {
  markdown: string;
  onChange: (nextMarkdown: string) => void;
  onDelete?: () => void;
  onSource?: () => void;
};

export type MarkdownGridTableWidgetOptions = MarkdownTableWidgetOptions;

export type TableExtensionProps = {
  bindEnter: boolean;
  bindTab: boolean;
};
