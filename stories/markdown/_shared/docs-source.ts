/** Docs source snippets for markdown feature stories (public APIs, not wrappers). */

export function markdownPreviewDocsSource(fixtureExport: string): string {
  return `<script lang="ts">
  import { MarkdownPreview } from "@lapismd/mira/preview";
  import { mermaidExtension } from "@mira-mde/plugin-mermaid";
  import { ${fixtureExport} } from "../fixtures";
  import { storyFileAdapter } from "../_shared/file-adapter";
</script>

<MarkdownPreview
  value={${fixtureExport}}
  extensions={[mermaidExtension()]}
  fileAdapter={storyFileAdapter}
  class="markdown-preview-surface markdown-rendered"
/>`;
}

export function markdownEditorDocsSource(
  fixtureExport: string,
  mode: "live-preview" | "source",
): string {
  return `<script lang="ts">
  import { MiraDefaultMde, MiraFeature } from "@mira-mde/default-ui/svelte";
  import type { MiraMode } from "@lapismd/mira/extensions";
  import { ${fixtureExport} } from "../fixtures";
  import { storyFileAdapter } from "../_shared/file-adapter";

  let value = $state(${fixtureExport});
  let mode = $state<MiraMode>("${mode}");
</script>

<MiraDefaultMde
  bind:value
  bind:mode
  fileAdapter={storyFileAdapter}
  features={{
    [MiraFeature.Mermaid]: true,
    [MiraFeature.Tables]: true,
    [MiraFeature.GridTables]: true,
  }}
/>`;
}

export function markdownOutlineDocsSource(
  fixtureExport: string,
  variant: "floating" | "sidebar" = "floating",
): string {
  return `<script lang="ts">
  import { MiraDefaultMde } from "@mira-mde/default-ui/svelte";
  import { ${fixtureExport} } from "../fixtures";

  let value = $state(${fixtureExport});
</script>

<MiraDefaultMde
  bind:value
  mode="preview"
  outline
  outlineVariant="${variant}"
/>`;
}
