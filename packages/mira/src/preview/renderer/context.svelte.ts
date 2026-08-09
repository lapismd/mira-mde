import { getContext, setContext } from "svelte";
import type {
  MiraAssetResolver,
  MiraFileAdapter,
  MiraLinkResolver,
  MiraRendererComponents,
  MiraResolvedListCallout,
} from "@lapismd/mira/extensions";
import type {
  HastNode,
  MarkdownChangeHandler,
  MarkdownPostProcess,
} from "./types";
import type { FrontmatterConfig } from "../components/frontmatter-utils";
import type { Pluggable } from "unified";
import type { Options as RemarkRehypeOptions } from "remark-rehype";

const MARKDOWN_CONTEXT = Symbol("mira-markdown-context");
const AST_NODE_CONTEXT = Symbol("mira-ast-node-context");

export type MarkdownContext = {
  markdown: string;
  sourcePath?: string;
  remarkPlugins: Pluggable[];
  rehypePlugins: Pluggable[];
  remarkRehypeOptions: RemarkRehypeOptions;
  components: MiraRendererComponents;
  linkResolver?: MiraLinkResolver;
  assetResolver?: MiraAssetResolver;
  fileAdapter?: MiraFileAdapter;
  listCallouts: MiraResolvedListCallout[];
  postProcess: MarkdownPostProcess;
  onChange?: MarkdownChangeHandler;
  onFrontmatterChange?: (nextYaml: string, nextValue: string) => void;
  frontmatterOpen: boolean;
  frontmatterConfig?: FrontmatterConfig;
  dialog: boolean;
};

export type AstNodeContext = {
  node: HastNode;
  parent: HastNode | null;
};

export function setMarkdownContext(context: MarkdownContext): MarkdownContext {
  setContext(MARKDOWN_CONTEXT, context);
  return context;
}

export function useMarkdownContext(): MarkdownContext {
  return getContext<MarkdownContext>(MARKDOWN_CONTEXT);
}

export function tryUseMarkdownContext(): MarkdownContext | null {
  return getContext<MarkdownContext | undefined>(MARKDOWN_CONTEXT) ?? null;
}

export const useMarkdown = useMarkdownContext;

export function setAstNodeContext(context: AstNodeContext): AstNodeContext {
  setContext(AST_NODE_CONTEXT, context);
  return context;
}

export function useAstNodeContext(): AstNodeContext {
  return getContext<AstNodeContext>(AST_NODE_CONTEXT);
}

export const useAstNode = useAstNodeContext;

export function getNodeRenderKey(
  node: HastNode,
  markdown: string,
  index: number,
): string {
  const typedNode = node as HastNode & {
    position?: {
      start?: { offset?: number; line?: number };
      end?: { offset?: number; line?: number };
    };
    tagName?: string;
    value?: string;
  };
  const startOffset =
    typedNode.position?.start?.offset ?? typedNode.position?.start?.line;
  const endOffset = typedNode.position?.end?.offset;
  const excerpt =
    typeof startOffset === "number"
      ? markdown.slice(
          startOffset,
          typeof endOffset === "number"
            ? Math.min(endOffset, startOffset + 96)
            : startOffset + 48,
        )
      : (typedNode.value?.slice(0, 48) ?? "");

  return [
    typedNode.type,
    typedNode.tagName ?? "",
    startOffset ?? index,
    endOffset ?? "",
    hashString(excerpt),
    index,
  ].join(":");
}

function hashString(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}
