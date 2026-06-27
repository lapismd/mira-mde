import type { MiraRendererComponents } from "@mira-mde/extensions";
import type {
  Root as HastRoot,
  Element,
  Text,
  Comment,
  RootContent,
} from "hast";
import type { Pluggable } from "unified";

export type ComponentsMap = MiraRendererComponents;
export type HastNode = HastRoot | Element | Text | Comment | RootContent;
export type HastProperties = Record<string, unknown>;
export type Parser = (md: string) => HastNode;

export type MarkdownPostProcess = (
  contentEl: HTMLElement,
  node: HastNode,
  parent: HastNode | null,
) => void;

export type MarkdownParserOptions = {
  remarkPlugins?: Pluggable[];
  rehypePlugins?: Pluggable[];
};
