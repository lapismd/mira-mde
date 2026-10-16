// @ts-nocheck
import { mount } from "svelte";
import GridEditorTable from "../grid-editor-table.svelte";
import { GridTableNode } from "../grid-table";
import type { MarkdownGridTableWidgetOptions } from "../types";
import { createSourceButton } from "./source-button";
import { registerTableWidgetMount } from "./lifecycle";

export function createMarkdownGridTableWidget({
  markdown,
  onChange,
  onDelete,
  onSource,
  extensions = [],
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

  const component = mount(GridEditorTable, {
    target: root,
    props: {
      node,
      extensions,
      onChange: (nextMarkdown: string) => onChange(nextMarkdown.trimEnd()),
      onDelete: () => onDelete?.(),
    },
  });

  registerTableWidgetMount(root, component);
  return root;
}
