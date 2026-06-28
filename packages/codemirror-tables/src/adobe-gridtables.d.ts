declare module "@adobe/mdast-util-gridtables" {
  export const TYPE_TABLE: string;
  export function mdast2hastGridTablesHandler(): any;
  export function gridTablesFromMarkdown(): any;
  export function gridTablesToMarkdown(): any;
}
