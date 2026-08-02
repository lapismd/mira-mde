<script lang="ts">
  import {
    MiraDefaultMde,
    MiraFeature,
    type MiraDefaultFeatureConfigs,
    type MiraDefaultMdeProps,
    type MiraDefaultToolbarDefinition,
    type MiraFeatureFlags,
  } from "@mira-mde/default-ui/svelte";
  import type {
    MiraExtension,
    MiraImageConfig,
    MiraMarkdownAuthoringConfig,
    MiraMode,
    MiraTheme,
  } from "@mira-mde/extensions";
  import { storyFileAdapter } from "./file-adapter";

  type Props = {
    value: string;
    mode?: MiraMode;
    sourcePath?: string;
    theme?: MiraTheme;
    readonly?: boolean;
    lineWrapping?: boolean;
    spellcheck?: boolean;
    indentGuides?: boolean;
    indentWithTabs?: boolean;
    indentWidth?: number;
    outline?: boolean;
    outlineVariant?: MiraDefaultMdeProps["outlineVariant"];
    emoji?: boolean;
    frontmatterOpen?: boolean;
    htmlPolicy?: MiraDefaultMdeProps["htmlPolicy"];
    features?: MiraFeatureFlags;
    featureConfigs?: MiraDefaultFeatureConfigs;
    extensions?: MiraExtension[];
    imageConfig?: MiraImageConfig;
    authoring?: MiraMarkdownAuthoringConfig;
    toolbars?: MiraDefaultToolbarDefinition[];
    height?: string;
    width?: string;
  };

  let {
    value = $bindable(""),
    mode = $bindable<MiraMode>("live-preview"),
    sourcePath = "story.md",
    theme = "light",
    readonly = false,
    lineWrapping = true,
    spellcheck = true,
    indentGuides = true,
    indentWithTabs = false,
    indentWidth = 2,
    outline = false,
    outlineVariant = "floating",
    emoji = false,
    frontmatterOpen = true,
    htmlPolicy = "trusted",
    features = {},
    featureConfigs = {},
    extensions = [],
    imageConfig,
    authoring,
    toolbars = [],
    height = "34rem",
    width = "100%",
  }: Props = $props();

  const mergedFeatures = $derived({
    [MiraFeature.Mermaid]: true,
    [MiraFeature.Tables]: true,
    [MiraFeature.GridTables]: true,
    ...features,
  });
</script>

<div
  class="mira-story-surface mira-story-surface--editor"
  style={`--mira-story-editor-height: ${height}; max-width: 100%; width: ${width};`}
>
  <MiraDefaultMde
    bind:value
    bind:mode
    {theme}
    {sourcePath}
    {readonly}
    {lineWrapping}
    {spellcheck}
    {indentGuides}
    {indentWithTabs}
    {indentWidth}
    {outline}
    {outlineVariant}
    {emoji}
    {frontmatterOpen}
    {htmlPolicy}
    fileAdapter={storyFileAdapter}
    features={mergedFeatures}
    {featureConfigs}
    {extensions}
    {imageConfig}
    {authoring}
    {toolbars}
    class="mira-story-editor"
  />
</div>
