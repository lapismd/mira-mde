import { getContext, setContext } from "svelte";
import type {
  MiraAssetResolver,
  MiraLinkResolver,
  MiraRendererComponents,
} from "@mira-mde/extensions";
import type { HastNode, MarkdownPostProcess } from "./types";

const MARKDOWN_CONTEXT = Symbol("mira-markdown-context");
const AST_NODE_CONTEXT = Symbol("mira-ast-node-context");

export type MarkdownContext = {
  markdown: string;
  sourcePath?: string;
  components: MiraRendererComponents;
  linkResolver?: MiraLinkResolver;
  assetResolver?: MiraAssetResolver;
  postProcess: MarkdownPostProcess;
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

export function setAstNodeContext(context: AstNodeContext): AstNodeContext {
  setContext(AST_NODE_CONTEXT, context);
  return context;
}

export function useAstNodeContext(): AstNodeContext {
  return getContext<AstNodeContext>(AST_NODE_CONTEXT);
}

export function getNodeRenderKey(node: HastNode, index: number): string {
  const typedNode = node as HastNode & {
    position?: { start?: { offset?: number; line?: number } };
    tagName?: string;
    value?: string;
  };

  return [
    typedNode.type,
    typedNode.tagName ?? "",
    typedNode.position?.start?.offset ??
      typedNode.position?.start?.line ??
      index,
    typedNode.value?.slice(0, 24) ?? "",
    index,
  ].join(":");
}
