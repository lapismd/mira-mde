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
    .use(rehypePlugins)
    .use(rehypePropsToSvelteProps);

  return (md: string) => processor.runSync(processor.parse(md)) as HastNode;
}

const rehypePropsToSvelteProps: UnifiedPlugin = () => {
  return (tree) => {
    visitHast(tree as HastNode, (node) => {
      if (node.type !== "element") {
        return;
      }

      node.properties = normalizeProperties(node.properties ?? {}) as any;
    });
  };
};

export function normalizeProperties(
  properties: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(properties)) {
    let normalizedKey = key;
    let normalizedValue = value;

    if (key === "className") {
      normalizedKey = "class";
      normalizedValue = Array.isArray(value) ? value.join(" ") : value;
    } else if (key.startsWith("aria") && key !== "aria") {
      normalizedKey = `aria-${key.slice(4).toLowerCase()}`;
    } else if (key.startsWith("data") && key !== "data") {
      normalizedKey = toKebabAttribute(key);
    } else if (svgCamelCaseAttributes.has(key)) {
      normalizedKey = toKebabAttribute(key);
    } else if (htmlCamelCaseAttributes[key]) {
      normalizedKey = htmlCamelCaseAttributes[key];
    }

    if (normalizedValue === true && key === "checked") {
      normalizedValue = "";
    }

    next[normalizedKey] = normalizedValue;
  }

  return next;
}

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

export const voidElements = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

export const svgElements = new Set([
  "svg",
  "g",
  "path",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "rect",
  "text",
  "tspan",
  "defs",
  "marker",
  "pattern",
  "clipPath",
  "mask",
  "linearGradient",
  "radialGradient",
  "stop",
  "foreignObject",
  "title",
  "desc",
  "use",
]);

const svgCamelCaseAttributes = new Set([
  "alignmentBaseline",
  "baselineShift",
  "clipPath",
  "clipRule",
  "colorInterpolation",
  "dominantBaseline",
  "fillOpacity",
  "fillRule",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "markerEnd",
  "markerMid",
  "markerStart",
  "preserveAspectRatio",
  "strokeDasharray",
  "strokeDashoffset",
  "strokeLinecap",
  "strokeLinejoin",
  "strokeMiterlimit",
  "strokeOpacity",
  "strokeWidth",
  "textAnchor",
  "viewBox",
  "xlinkHref",
]);

const htmlCamelCaseAttributes: Record<string, string> = {
  colSpan: "colspan",
  rowSpan: "rowspan",
};

function toKebabAttribute(value: string): string {
  return value.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`);
}
