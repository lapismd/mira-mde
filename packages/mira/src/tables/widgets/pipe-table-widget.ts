// @ts-nocheck
import { mount } from "svelte";
import EditorTable from "../editor-table.svelte";
import { TableNode } from "../table-node";
import type { MarkdownTableWidgetOptions } from "../types";
import { createSourceButton } from "./source-button";

export function createMarkdownTableWidget({
  markdown,
  onChange,
  onDelete,
  onSource,
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

  mount(EditorTable, {
    target: root,
    props: {
      node,
      onChange: (nextMarkdown: string) => onChange(nextMarkdown.trimEnd()),
      onDelete: () => onDelete?.(),
    },
  });

  return root;
}
