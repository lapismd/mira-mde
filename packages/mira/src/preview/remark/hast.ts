import type { Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

export const remarkDirectivesToHast: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, (node: any) => {
      if (
        node.type !== "containerDirective" &&
        node.type !== "leafDirective" &&
        node.type !== "textDirective"
      ) {
        return;
      }

      node.data = {
        ...(node.data ?? {}),
        hName: "directive",
        hProperties: {
          ...(node.attributes ?? {}),
          "data-directive": node.name,
        },
      };
    });
  };
};

export const remarkFrontmatterToHast: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, (node: any) => {
      if (node.type !== "yaml" && node.type !== "toml") {
        return;
      }

      const frontmatterType = node.type;
      node.type = "frontmatter";
      node.data = {
        ...(node.data ?? {}),
        hName: "frontmatter",
        hProperties: {
          ...(node.data?.hProperties ?? {}),
          frontmatter: node.value ?? "",
          value: node.value ?? "",
          "data-frontmatter": frontmatterType,
        },
        hChildren: [],
      };
    });
  };
};

export const remarkPositionsToData: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, (node: any) => {
      if (!node.position) {
        return;
      }
      node.data = {
        ...(node.data ?? {}),
        hProperties: {
          ...(node.data?.hProperties ?? {}),
          "data-line": node.position.start.line,
          "data-offset": node.position.start.offset,
          "data-offset-end": node.position.end.offset,
        },
      };
    });
  };
};
