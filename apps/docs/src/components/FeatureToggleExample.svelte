<script lang="ts">
  import SlidersHorizontalIcon from "@lucide/svelte/icons/sliders-horizontal";
  import {
    MiraDefaultMde,
    MiraFeature,
    type MiraDefaultToolbarActionContext,
    type MiraDefaultToolbarDefinition,
    type MiraFeatureFlags,
  } from "@mira-mde/default-ui/svelte";
  import type { MiraMode } from "@mira-mde/extensions";
  import { featureToggleMarkdown } from "../data/examples";
  import { docsFileAdapter } from "../lib/file-adapter";

  let value = $state(featureToggleMarkdown);
  let mode = $state<MiraMode>("preview");
  let tables = $state(true);
  let mermaid = $state(true);
  let splitMode = $state(true);

  const features = $derived<MiraFeatureFlags>({
    [MiraFeature.Tables]: tables,
    [MiraFeature.GridTables]: tables,
    [MiraFeature.Mermaid]: mermaid,
    [MiraFeature.SplitMode]: splitMode,
  });

  const toolbars: MiraDefaultToolbarDefinition[] = [
    {
      id: "docs-feature-flags",
      label: "Feature flags",
      align: "end",
      items: [
        {
          type: "dropdown",
          id: "feature-flags",
          label: "Feature flags",
          icon: SlidersHorizontalIcon,
          items: [
            {
              type: "label",
              label: "Feature flags",
            },
            {
              id: "toggle-tables",
              label: "Tables",
              checked: () => tables,
              run() {
                tables = !tables;
              },
            },
            {
              id: "toggle-mermaid",
              label: "Mermaid",
              checked: () => mermaid,
              run() {
                mermaid = !mermaid;
              },
            },
            {
              id: "toggle-split-mode",
              label: "Split mode",
              checked: () => splitMode,
              run(context: MiraDefaultToolbarActionContext) {
                splitMode = !splitMode;
                if (!splitMode && context.getMode() === "split") {
                  context.setMode("preview");
                }
              },
            },
          ],
        },
      ],
    },
  ];
</script>

<section
  class="not-content docs-live-editor"
  style="--docs-live-editor-height: 30rem;"
>
  <div class="docs-live-editor__header">
    <div>
      <p class="docs-live-editor__title">Feature toggles</p>
      <p class="docs-live-editor__description">
        Toggle editor features from the toolbar and the active surface adapts.
      </p>
    </div>
  </div>

  <MiraDefaultMde
    bind:value
    bind:mode
    {features}
    {toolbars}
    fileAdapter={docsFileAdapter}
    class="docs-live-editor__surface"
    sourcePath="feature-toggles.md"
  />
</section>
