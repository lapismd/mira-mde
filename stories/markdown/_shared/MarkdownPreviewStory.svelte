<script lang="ts">
  import { MarkdownPreview } from "@mira-mde/preview";
  import { mermaidExtension } from "@mira-mde/plugin-mermaid";
  import { storyFileAdapter } from "./file-adapter";

  type Props = {
    value: string;
    sourcePath?: string;
  };

  let { value, sourcePath = "story.md" }: Props = $props();

  const extensions = [mermaidExtension()];
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
