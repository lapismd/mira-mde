/** Docs source snippets for markdown feature stories (public APIs, not wrappers). */

export function markdownPreviewDocsSource(fixtureExport: string): string {
  return `<script lang="ts">
  import { MarkdownPreview } from "@lapismd/mira/preview";
  import { mermaidExtension } from "@lapismd/mira-plugin-mermaid";
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
  import { MiraEditor, MiraFeature } from "@lapismd/mira-editor";
  import type { MiraMode } from "@lapismd/mira/extensions";
  import { ${fixtureExport} } from "../fixtures";
  import { storyFileAdapter } from "../_shared/file-adapter";

  let value = $state(${fixtureExport});
  let mode = $state<MiraMode>("${mode}");
</script>

<MiraEditor
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
  import { MiraEditor } from "@lapismd/mira-editor";
  import { ${fixtureExport} } from "../fixtures";

  let value = $state(${fixtureExport});
</script>

<MiraEditor
  bind:value
  mode="preview"
  outline
  outlineVariant="${variant}"
/>`;
}
