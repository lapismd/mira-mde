// @ts-nocheck
import { mount } from "svelte";
import EditorTable from "../editor-table.svelte";
import { TableNode } from "../table-node";
import type { MarkdownTableWidgetOptions } from "../types";
import { createSourceButton } from "./source-button";
import { registerTableWidgetMount } from "./lifecycle";

export function createMarkdownTableWidget({
  markdown,
  onChange,
  onDelete,
  onSource,
  extensions = [],
}: MarkdownTableWidgetOptions): HTMLElement {
  const root = document.createElement("div");
  root.className = "mira-table-widget-shell relative";
  root.contentEditable = "false";

  if (onSource) {
    root.append(createSourceButton(onSource));
  }

  const node =
    TableNode.fromMarkdown(markdown) ??
    TableNode.fromMarkdown("|  |\n| --- |\n|  |") ??
    new TableNode();

  const component = mount(EditorTable, {
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
