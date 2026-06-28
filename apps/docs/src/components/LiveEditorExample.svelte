<script lang="ts">
  import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
  import {
    MiraDefaultMde,
    MiraFeature,
    type MiraDefaultFeatureConfigs,
    type MiraDefaultMdeHandle,
    type MiraFeatureFlags
  } from "@mira-mde/default-ui/svelte";
  import type { MiraMode, MiraTheme } from "@mira-mde/extensions";

  type Props = {
    description?: string;
    featureConfigs?: MiraDefaultFeatureConfigs;
    features?: MiraFeatureFlags;
    height?: string;
    initialValue: string;
    mode?: MiraMode;
    readonly?: boolean;
    sourcePath?: string;
    theme?: MiraTheme;
    title?: string;
  };

  let {
    description = "",
    featureConfigs = {},
    features = {},
    height = "34rem",
    initialValue,
    mode = "live-preview",
    readonly = false,
    sourcePath = "docs.md",
    theme = "obsidian",
    title = "Live example"
  }: Props = $props();

  let editor = $state<MiraDefaultMdeHandle | null>(null);
  let value = $state(initialValue);
  let activeMode = $state<MiraMode>(mode);

  const mergedFeatures = $derived({
    [MiraFeature.Mermaid]: true,
    [MiraFeature.Tables]: true,
    [MiraFeature.GridTables]: true,
    ...features
  });

  function resetExample(): void {
    value = initialValue;
    activeMode = mode;
    editor?.setMarkdown(initialValue);
    editor?.setMode(mode);
  }
</script>

<section
  class="docs-live-editor"
  style={`--docs-live-editor-height: ${height};`}
>
  <div class="docs-live-editor__header">
    <div>
      <p class="docs-live-editor__title">{title}</p>
      {#if description}
        <p class="docs-live-editor__description">{description}</p>
      {/if}
    </div>
    <button class="docs-live-editor__reset" type="button" onclick={resetExample}>
      <RotateCcwIcon class="docs-live-editor__reset-icon" aria-hidden="true" />
      Reset
    </button>
  </div>

  <MiraDefaultMde
    bind:this={editor}
    bind:value
    bind:mode={activeMode}
    {readonly}
    {theme}
    {sourcePath}
    features={mergedFeatures}
    {featureConfigs}
    class="docs-live-editor__surface"
  />
</section>
