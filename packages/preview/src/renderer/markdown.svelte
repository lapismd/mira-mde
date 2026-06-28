<script module lang="ts">
  import type {
    MiraAssetResolver,
    MiraLinkResolver,
    MiraRendererComponents,
  } from "@mira-mde/extensions";
  import type { Pluggable } from "unified";
  import type { Options as RemarkRehypeOptions } from "remark-rehype";
  import type { MarkdownChangeHandler, MarkdownPostProcess } from "./types";

  export type MarkdownProps = {
    value: string;
    sourcePath?: string;
    remarkPlugins?: Pluggable[];
    rehypePlugins?: Pluggable[];
    remarkRehypeOptions?: RemarkRehypeOptions;
    components?: MiraRendererComponents;
    linkResolver?: MiraLinkResolver;
    assetResolver?: MiraAssetResolver;
    postProcess?: MarkdownPostProcess;
    onChange?: MarkdownChangeHandler;
    onFrontmatterChange?: (nextYaml: string, nextValue: string) => void;
    frontmatterOpen?: boolean;
  };
</script>

<script lang="ts">
  import Renderer from "./renderer.svelte";
  import { createParser } from "./utils";
  import {
    setMarkdownContext,
    type MarkdownContext,
  } from "./context.svelte";
  import type { HastNode, Parser } from "./types";

  let {
    value,
    sourcePath,
    remarkPlugins = [],
    rehypePlugins = [],
    remarkRehypeOptions = { allowDangerousHtml: true },
    components = {},
    linkResolver,
    assetResolver,
    postProcess = () => {},
    onChange,
    onFrontmatterChange,
    frontmatterOpen = true,
  }: MarkdownProps = $props();

  let parser = $derived<Parser>(
    createParser(remarkPlugins, rehypePlugins, remarkRehypeOptions),
  );
  let ast = $derived<HastNode>(parser(value));

  let contextState = $state<MarkdownContext>({
    markdown: "",
    sourcePath: undefined,
    components: {},
    linkResolver: undefined,
    assetResolver: undefined,
    postProcess: () => {},
    onChange: undefined,
    onFrontmatterChange: undefined,
    frontmatterOpen: true,
  });
  let context = setMarkdownContext(contextState);

  $effect.pre(() => {
    context.markdown = value;
    context.sourcePath = sourcePath;
    context.components = components;
    context.linkResolver = linkResolver;
    context.assetResolver = assetResolver;
    context.postProcess = postProcess;
    context.onChange = onChange;
    context.onFrontmatterChange = onFrontmatterChange;
    context.frontmatterOpen = frontmatterOpen;
  });
</script>

<Renderer astNode={ast} parent={null} />
