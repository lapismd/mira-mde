// @ts-nocheck
import { mount } from "svelte";
import GridEditorTable from "../grid-editor-table.svelte";
import { GridTableNode } from "../grid-table";
import type { MarkdownGridTableWidgetOptions } from "../types";
import { createSourceButton } from "./source-button";

export function createMarkdownGridTableWidget({
  markdown,
  onChange,
  onDelete,
  onSource,
}: MarkdownGridTableWidgetOptions): HTMLElement {
  const root = document.createElement("div");
  root.className =
    "mira-table-widget-shell mira-grid-table-widget-shell relative";
  root.contentEditable = "false";

  if (onSource) {
    root.append(createSourceButton(onSource));
  }

  const node =
    GridTableNode.fromMarkdown(markdown) ??
    GridTableNode.fromMarkdown("+---+\n|   |\n+---+") ??
    new GridTableNode();

  mount(GridEditorTable, {
    target: root,
    props: {
      node,
      onChange: (nextMarkdown: string) => onChange(nextMarkdown.trimEnd()),
      onDelete: () => onDelete?.(),
    },
  });

  return root;
}
