import type { Element, Root } from "hast";

export function findElement(
  node: Root | Element,
  tagName: string,
): Element | undefined {
  if (node.type === "element" && node.tagName === tagName) {
    return node;
  }
  for (const child of node.children ?? []) {
    if (child.type !== "element") {
      continue;
    }
    const result = findElement(child, tagName);
    if (result) {
      return result;
    }
  }
  return undefined;
}
