declare module "@adobe/remark-gridtables" {
  import type { Plugin } from "unified";

  const remarkGridTables: Plugin;
  export default remarkGridTables;
}

declare module "@adobe/mdast-util-gridtables" {
  export const TYPE_TABLE: string;
  export function mdast2hastGridTablesHandler(): (...args: any[]) => any;
}
