<script lang="ts">
  import {
    MiraDefaultMde,
    MiraFeature,
    type MiraFeatureFlags,
  } from "@mira-mde/default-ui/svelte";
  import type { MiraMode } from "@mira-mde/extensions";
  import { featureToggleMarkdown } from "../data/examples";
  import { docsFileAdapter } from "../lib/file-adapter";

  let value = $state(featureToggleMarkdown);
  let mode = $state<MiraMode>("live-preview");
  let tables = $state(true);
  let mermaid = $state(true);
  let splitMode = $state(true);

  const features = $derived<MiraFeatureFlags>({
    [MiraFeature.Tables]: tables,
    [MiraFeature.GridTables]: tables,
    [MiraFeature.Mermaid]: mermaid,
    [MiraFeature.SplitMode]: splitMode,
  });
</script>

<section class="docs-live-editor" style="--docs-live-editor-height: 30rem;">
  <div class="docs-live-editor__header">
    <div>
      <p class="docs-live-editor__title">Feature toggles</p>
      <p class="docs-live-editor__description">
        Toggle editor features and the toolbar adapts to the active surface.
      </p>
    </div>
  </div>

  <div class="docs-live-editor__toggles" aria-label="Feature toggles">
    <label class="docs-live-editor__toggle">
      <input type="checkbox" bind:checked={tables} />
      Tables
    </label>
    <label class="docs-live-editor__toggle">
      <input type="checkbox" bind:checked={mermaid} />
      Mermaid
    </label>
    <label class="docs-live-editor__toggle">
      <input type="checkbox" bind:checked={splitMode} />
      Split mode
    </label>
  </div>

  <MiraDefaultMde
    bind:value
    bind:mode
    {features}
    fileAdapter={docsFileAdapter}
    class="docs-live-editor__surface"
    sourcePath="feature-toggles.md"
  />
</section>
