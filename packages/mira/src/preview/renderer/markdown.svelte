<script module lang="ts">
  import type {
    MiraAssetResolver,
    MiraExtension,
    MiraFileAdapter,
    MiraResolvedListCallout,
    MiraLinkResolver,
    MiraRendererComponents,
  } from "@lapismd/mira/extensions";
  import type { Pluggable } from "unified";
  import type { Options as RemarkRehypeOptions } from "remark-rehype";
  import type { MarkdownChangeHandler, MarkdownPostProcess } from "./types";
  import type { FrontmatterConfig } from "../components/frontmatter-utils";

  export type MarkdownProps = {
    value: string;
    sourcePath?: string;
    extensions?: MiraExtension[];
    remarkPlugins?: Pluggable[];
    rehypePlugins?: Pluggable[];
    remarkRehypeOptions?: RemarkRehypeOptions;
    components?: MiraRendererComponents;
    linkResolver?: MiraLinkResolver;
    assetResolver?: MiraAssetResolver;
    fileAdapter?: MiraFileAdapter;
    listCallouts?: MiraResolvedListCallout[];
    postProcess?: MarkdownPostProcess;
    onChange?: MarkdownChangeHandler;
    onFrontmatterChange?: (nextYaml: string, nextValue: string) => void;
    frontmatterOpen?: boolean;
    frontmatterConfig?: FrontmatterConfig;
    dialog?: boolean;
  };
</script>

<script lang="ts">
  import Renderer from "./renderer.svelte";
  import { createParser } from "./utils";
  import { setMarkdownContext, type MarkdownContext } from "./context.svelte";
  import type { HastNode, Parser } from "./types";

  let {
    value,
    sourcePath,
    extensions = [],
    remarkPlugins = [],
    rehypePlugins = [],
    remarkRehypeOptions = { allowDangerousHtml: true },
    components = {},
    linkResolver,
    assetResolver,
    fileAdapter,
    listCallouts = [],
    postProcess = () => {},
    onChange,
    onFrontmatterChange,
    frontmatterOpen = true,
    frontmatterConfig,
    dialog = false,
  }: MarkdownProps = $props();

  let parser = $derived<Parser>(
    createParser(remarkPlugins, rehypePlugins, remarkRehypeOptions),
  );
  let ast = $derived<HastNode>(parser(value));

  let contextState = $state<MarkdownContext>({
    markdown: "",
    sourcePath: undefined,
    extensions: [],
    remarkPlugins: [],
    rehypePlugins: [],
    remarkRehypeOptions: { allowDangerousHtml: true },
    components: {},
    linkResolver: undefined,
    assetResolver: undefined,
    fileAdapter: undefined,
    listCallouts: [],
    postProcess: () => {},
    onChange: undefined,
    onFrontmatterChange: undefined,
    frontmatterOpen: true,
    frontmatterConfig: undefined,
    dialog: false,
  });
  let context = setMarkdownContext(contextState);

  $effect.pre(() => {
    context.markdown = value;
    context.sourcePath = sourcePath;
    context.extensions = extensions;
    context.remarkPlugins = remarkPlugins;
    context.rehypePlugins = rehypePlugins;
    context.remarkRehypeOptions = remarkRehypeOptions;
    context.components = components;
    context.linkResolver = linkResolver;
    context.assetResolver = assetResolver;
    context.fileAdapter = fileAdapter;
    context.listCallouts = listCallouts;
    context.postProcess = postProcess;
    context.onChange = onChange;
    context.onFrontmatterChange = onFrontmatterChange;
    context.frontmatterOpen = frontmatterOpen;
    context.frontmatterConfig = frontmatterConfig;
    context.dialog = dialog;
  });
</script>

<Renderer astNode={ast} parent={null} />
