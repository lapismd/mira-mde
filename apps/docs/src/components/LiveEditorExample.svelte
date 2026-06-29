<script lang="ts">
  import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
  import {
    MiraDefaultMde,
    MiraFeature,
    type MiraDefaultFeatureConfigs,
    type MiraDefaultMdeHandle,
    type MiraDefaultToolbarDefinition,
    type MiraFeatureFlags,
  } from "@mira-mde/default-ui/svelte";
  import type { MiraMode, MiraTheme } from "@mira-mde/extensions";
  import { docsFileAdapter } from "../lib/file-adapter";

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
    mode = "preview",
    readonly = false,
    sourcePath = "docs.md",
    theme = "obsidian",
    title = "Live example",
  }: Props = $props();

  let editor = $state<MiraDefaultMdeHandle | null>(null);
  let value = $state("");
  let activeMode = $state<MiraMode>("preview");

  $effect(() => {
    value = initialValue;
    activeMode = mode;
  });

  const mergedFeatures = $derived({
    [MiraFeature.Mermaid]: true,
    [MiraFeature.Tables]: true,
    [MiraFeature.GridTables]: true,
    ...features,
  });

  const resetToolbars = $derived<MiraDefaultToolbarDefinition[]>([
    {
      id: "docs-example-actions",
      label: "Example actions",
      align: "end",
      items: [
        {
          id: "reset-example",
          label: "Reset example",
          icon: RotateCcwIcon,
          run: resetExample,
        },
      ],
    },
  ]);

  function resetExample(): void {
    value = initialValue;
    activeMode = mode;
    editor?.setMarkdown(initialValue);
    editor?.setMode(mode);
  }
</script>

<section
  class="not-content docs-live-editor"
  style={`--docs-live-editor-height: ${height};`}
>
  <div class="docs-live-editor__header">
    <div>
      <p class="docs-live-editor__title">{title}</p>
      {#if description}
        <p class="docs-live-editor__description">{description}</p>
      {/if}
    </div>
  </div>

  <MiraDefaultMde
    bind:this={editor}
    bind:value
    bind:mode={activeMode}
    {readonly}
    {theme}
    {sourcePath}
    fileAdapter={docsFileAdapter}
    features={mergedFeatures}
    {featureConfigs}
    toolbars={resetToolbars}
    class="docs-live-editor__surface"
  />
</section>
