<script lang="ts">
  import {
    MiraEditor,
    MiraFeature,
    type MiraEditorFeatureConfigs,
    type MiraEditorProps,
    type MiraEditorToolbarDefinition,
    type MiraFeatureFlags,
  } from "@lapismd/mira-editor";
  import type {
    MiraExtension,
    MiraImageConfig,
    MiraMarkdownAuthoringConfig,
    MiraMode,
    MiraTheme,
  } from "@lapismd/mira/extensions";
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
    outlineVariant?: MiraEditorProps["outlineVariant"];
    emoji?: boolean;
    frontmatterOpen?: boolean;
    htmlPolicy?: MiraEditorProps["htmlPolicy"];
    features?: MiraFeatureFlags;
    featureConfigs?: MiraEditorFeatureConfigs;
    extensions?: MiraExtension[];
    imageConfig?: MiraImageConfig;
    authoring?: MiraMarkdownAuthoringConfig;
    toolbars?: MiraEditorToolbarDefinition[];
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
  <MiraEditor
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
