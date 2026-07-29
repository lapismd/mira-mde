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
  import MarkdownEmbed from "./markdown-embed.svelte";

  type Props = {
    id?: string;
    href?: string;
    target?: string;
    text?: string;
    label?: string;
    width?: number;
    height?: number;
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

  let { id, href, target, text, label, width, height, ...previewProps }: Props =
    $props();

  const activeTarget = $derived(target || id || href || "");
  const details = $derived([
    text || label,
    width && width > 0
      ? `${Math.round(width)}${height && height > 0 ? `x${Math.round(height)}` : ""}`
      : undefined,
  ]);
  const value = $derived(
    `![[${[activeTarget, ...details].filter(Boolean).join("|")}]]`,
  );
</script>

<MarkdownEmbed {value} {...previewProps} />
