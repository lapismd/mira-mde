import { mount, tick, unmount } from "svelte";
import { expect, it } from "vitest";
import { defineMiraExtension } from "@lapismd/mira/extensions";
import type { Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import MarkdownPreview from "./markdown-preview.svelte";

// Extension transforms can preserve an explicitly empty optional children field.
const optionalChildren: Plugin<[], Root> = () => (tree) => {
  visit(tree, (node) => {
    const leaf = node as unknown as { type: string; children?: unknown[] };
    if (["pathlink", "wikilink", "embed"].includes(leaf.type))
      leaf.children = undefined;
  });
};

it.each([
  ["[Notes/alpha.md]", "Notes/alpha.md"],
  ["[[Notes/alpha.md|Alpha]]", "Alpha"],
  ["![[Notes/diagram.png|Diagram]]", "Diagram"],
])(
  "renders leaf link syntax %s through the actual preview",
  async (value, label) => {
    const target = document.createElement("div");
    const component = mount(MarkdownPreview, {
      target,
      props: {
        value,
        embed: true,
        extensions: [
          defineMiraExtension({
            name: "optional-children",
            remarkPlugins: [optionalChildren],
          }),
        ],
      },
    });
    try {
      await tick();
      expect(target.textContent).toContain(label);
    } finally {
      await unmount(component);
    }
  },
);
