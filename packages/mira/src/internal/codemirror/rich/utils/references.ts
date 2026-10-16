import type { Text } from "@codemirror/state";
import type { Root, RootContent } from "mdast";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { toMarkdown } from "mdast-util-to-markdown";

const parser = unified().use(remarkParse);
const trees = new WeakMap<Text, Root>();
function referenceTree(doc: Text | string): Root {
  if (typeof doc === "string") return parser.parse(doc);
  let tree = trees.get(doc);
  if (!tree) {
    tree = parser.parse(doc.toString());
    trees.set(doc, tree);
  }
  return tree;
}
const cache = new WeakMap<Text, readonly MarkdownReferenceDefinition[]>();
export type MarkdownReferenceDefinition = Readonly<{
  from: number;
  to: number;
  label: string;
  image: boolean;
  markdown: string;
}>;
const normalize = (id: string) => id.trim().replace(/\s+/gu, " ").toUpperCase();

export function markdownReferenceTarget(
  doc: Text | string,
  label: string,
): { definition: string; label: string } | null {
  let result: { definition: string; label: string } | null = null;
  function walk(node: Root | RootContent) {
    if (result) return;
    if (
      node.type === "definition" &&
      normalize(node.identifier) === normalize(label)
    )
      result = {
        definition: toMarkdown({ type: "root", children: [node] }).trimEnd(),
        label: node.label ?? node.identifier,
      };
    if ("children" in node)
      for (const child of node.children) walk(child as RootContent);
  }
  walk(referenceTree(doc));
  return result;
}

/** Definitions are document syntax, not opening-bracket patterns in prose. */
export function markdownReferenceDefinitions(
  doc: Text,
): readonly MarkdownReferenceDefinition[] {
  const retained = cache.get(doc);
  if (retained) return retained;
  const tree = referenceTree(doc);
  const imageReferences = new Set<string>();
  function collect(node: Root | RootContent) {
    if (node.type === "imageReference")
      imageReferences.add(normalize(node.identifier));
    if ("children" in node)
      for (const child of node.children) collect(child as RootContent);
  }
  collect(tree);
  const definitions: MarkdownReferenceDefinition[] = [];
  for (const definition of tree.children) {
    if (definition.type !== "definition" || !definition.position) continue;
    const from = definition.position.start.offset;
    const to = definition.position.end.offset;
    if (from === undefined || to === undefined) continue;
    const label = definition.label ?? definition.identifier;
    const image = imageReferences.has(normalize(definition.identifier));
    const reference = {
      identifier: definition.identifier,
      label: definition.label,
      referenceType: "full" as const,
    };
    const usage = image
      ? { type: "imageReference" as const, ...reference, alt: label }
      : {
          type: "linkReference" as const,
          ...reference,
          children: [{ type: "text" as const, value: definition.url }],
        };
    definitions.push({
      from,
      to,
      label,
      image,
      markdown: toMarkdown({
        type: "root",
        children: [{ type: "paragraph", children: [usage] }, definition],
      }),
    });
  }
  cache.set(doc, definitions);
  return definitions;
}
