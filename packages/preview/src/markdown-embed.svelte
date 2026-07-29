<script lang="ts">
  import type {
    MiraAssetResolver,
    MiraExtension,
    MiraFileAdapter,
    MiraLinkResolver,
    MiraListCallout,
    MiraMarkdownPostProcessor,
    MiraRendererComponents,
  } from "@mira-mde/extensions";
  import type { FrontmatterConfig } from "./components/frontmatter-utils";
  import MarkdownPreview from "./markdown-preview.svelte";

  type Props = {
    value?: string;
    sourcePath?: string;
    extensions?: MiraExtension[];
    components?: MiraRendererComponents;
    class?: string;
    highlight?: boolean;
    linkResolver?: MiraLinkResolver;
    assetResolver?: MiraAssetResolver;
    fileAdapter?: MiraFileAdapter;
    frontmatterOpen?: boolean;
    frontmatterConfig?: FrontmatterConfig;
    headingIds?: boolean;
    headingIdPrefix?: string;
    htmlPolicy?: "trusted" | "safe";
    emoji?: boolean;
    dialog?: boolean;
    listCallouts?: MiraListCallout[];
    postProcess?: MiraMarkdownPostProcessor;
  };

  let {
    value = "",
    sourcePath,
    extensions = [],
    components = {},
    class: className = "",
    highlight = true,
    linkResolver,
    assetResolver,
    fileAdapter,
    frontmatterOpen = false,
    frontmatterConfig,
    headingIds = false,
    headingIdPrefix = "",
    htmlPolicy = "trusted",
    emoji = false,
    dialog = false,
    listCallouts = [],
    postProcess,
  }: Props = $props();
</script>

<MarkdownPreview
  {value}
  {sourcePath}
  {extensions}
  {components}
  class={className}
  {highlight}
  {linkResolver}
  {assetResolver}
  {fileAdapter}
  {frontmatterOpen}
  {frontmatterConfig}
  {headingIds}
  {headingIdPrefix}
  {htmlPolicy}
  {emoji}
  {dialog}
  {listCallouts}
  {postProcess}
  embed
/>
