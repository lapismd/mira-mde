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
export type HastRaw = {
  type: "raw";
  value: string;
};
export type HastNode =
  | HastRoot
  | Element
  | Text
  | Comment
  | HastRaw
  | RootContent;
export type HastProperties = Record<string, unknown>;
export type Parser = (md: string) => HastNode;

export type MarkdownPostProcess = (
  contentEl: HTMLElement,
  node: HastNode,
  parent: HastNode | null,
) => void;

export type MarkdownChangeHandler = (
  replacement: string,
  from: number,
  to: number,
) => void;

export type MarkdownParserOptions = {
  remarkPlugins?: Pluggable[];
  rehypePlugins?: Pluggable[];
};

export type {
  FrontmatterConfig,
  FrontmatterPathSegment,
  FrontmatterProperty,
  FrontmatterPropertyKind,
  FrontmatterTypeDefinition,
  FrontmatterWidgetContext,
  FrontmatterWidgetRenderer,
} from "../components/frontmatter-utils";
