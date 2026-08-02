<script lang="ts">
  import type {
    MiraAssetResolver,
    MiraExtension,
    MiraFileAdapter,
    MiraLinkResolver,
    MiraListCallout,
    MiraMarkdownPostProcessor,
    MiraRendererComponents,
  } from "@lapismd/mira/extensions";
  import type { FrontmatterConfig } from "./components/frontmatter-utils";
  import MarkdownPreview from "./markdown-preview.svelte";

  type Props = {
    id?: string;
    href?: string;
    target?: string;
    text?: string;
    label?: string;
    sourcePath?: string;
    extensions?: MiraExtension[];
    components?: MiraRendererComponents;
    class?: string;
    linkResolver?: MiraLinkResolver;
    assetResolver?: MiraAssetResolver;
    fileAdapter?: MiraFileAdapter;
    frontmatterConfig?: FrontmatterConfig;
    htmlPolicy?: "trusted" | "safe";
    emoji?: boolean;
    listCallouts?: MiraListCallout[];
    postProcess?: MiraMarkdownPostProcessor;
  };

  let {
    id,
    href,
    target,
    text,
    label,
    sourcePath,
    extensions = [],
    components = {},
    class: className = "",
    linkResolver,
    assetResolver,
    fileAdapter,
    frontmatterConfig,
    htmlPolicy = "trusted",
    emoji = false,
    listCallouts = [],
    postProcess,
  }: Props = $props();

  const activeTarget = $derived(target || id || href || "");
  const displayText = $derived(text || label);
  const value = $derived(
    `[[${[activeTarget, displayText].filter(Boolean).join("|")}]]`,
  );
</script>

<span class={`mira-note-link ${className}`.trim()}>
  <MarkdownPreview
    {value}
    {sourcePath}
    {extensions}
    {components}
    {linkResolver}
    {assetResolver}
    {fileAdapter}
    {frontmatterConfig}
    {htmlPolicy}
    {emoji}
    {listCallouts}
    {postProcess}
    inline
    highlight={false}
  />
</span>
