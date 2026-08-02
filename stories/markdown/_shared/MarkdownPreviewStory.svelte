<script lang="ts">
  import { MarkdownPreview } from "@lapismd/mira/preview";
  import { mermaidExtension } from "@mira-mde/plugin-mermaid";
  import type { MiraExtension } from "@lapismd/mira/extensions";
  import { storyFileAdapter } from "./file-adapter";

  type Props = {
    value: string;
    sourcePath?: string;
    extensions?: MiraExtension[];
  };

  let {
    value,
    sourcePath = "story.md",
    extensions: contributedExtensions = [],
  }: Props = $props();

  const extensions = $derived([mermaidExtension(), ...contributedExtensions]);
</script>

<div class="mira-story-surface mira-story-surface--preview">
  <MarkdownPreview
    {value}
    {sourcePath}
    {extensions}
    fileAdapter={storyFileAdapter}
    class="markdown-preview-surface markdown-rendered"
  />
</div>
