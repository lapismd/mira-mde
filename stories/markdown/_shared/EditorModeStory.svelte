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
    emoji?: boolean;
    frontmatterOpen?: boolean;
    htmlPolicy?: MiraDefaultMdeProps["htmlPolicy"];
    features?: MiraFeatureFlags;
    featureConfigs?: MiraDefaultFeatureConfigs;
    extensions?: MiraExtension[];
    imageConfig?: MiraImageConfig;
    toolbars?: MiraDefaultToolbarDefinition[];
    height?: string;
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
    emoji = false,
    frontmatterOpen = true,
    htmlPolicy = "trusted",
    features = {},
    featureConfigs = {},
    extensions = [],
    imageConfig,
    toolbars = [],
    height = "34rem",
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
  style={`--mira-story-editor-height: ${height};`}
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
    {emoji}
    {frontmatterOpen}
    {htmlPolicy}
    fileAdapter={storyFileAdapter}
    features={mergedFeatures}
    {featureConfigs}
    {extensions}
    {imageConfig}
    {toolbars}
    class="mira-story-editor"
  />
</div>
