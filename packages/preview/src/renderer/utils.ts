import { unified, type Pluggable, type Plugin as UnifiedPlugin } from "unified";
import remarkParse from "remark-parse";
import remarkRehype, {
  type Options as RemarkRehypeOptions,
} from "remark-rehype";
import type { HastNode, Parser } from "./types";

export function createParser(
  remarkPlugins: Pluggable[] = [],
  rehypePlugins: Pluggable[] = [],
  remarkRehypeOptions: RemarkRehypeOptions = { allowDangerousHtml: true },
): Parser {
  const processor = unified()
    .use(remarkParse)
    .use(remarkPlugins)
    .use(remarkRehype, remarkRehypeOptions)
    .use(rehypePropsToSvelteProps)
    .use(rehypePlugins);

  return (md: string) => processor.runSync(processor.parse(md)) as HastNode;
}

const rehypePropsToSvelteProps: UnifiedPlugin = () => {
  return (tree) => {
    visitHast(tree as HastNode, (node) => {
      if (node.type !== "element") {
        return;
      }

      const properties = node.properties ?? {};
      if (Array.isArray(properties.className)) {
        properties.class = properties.className.join(" ");
        delete properties.className;
      }

      if (properties.checked === true) {
        properties.checked = "";
      }

      node.properties = properties;
    });
  };
};

function visitHast(node: HastNode, visitor: (node: HastNode) => void): void {
  visitor(node);
  const children =
    "children" in node && Array.isArray(node.children) ? node.children : [];
  for (const child of children) {
    visitHast(child as HastNode, visitor);
  }
}

export function resolveComponent(
  components: Record<string, unknown>,
  tagName: string,
): unknown {
  return components[tagName] === undefined ? tagName : components[tagName];
}
