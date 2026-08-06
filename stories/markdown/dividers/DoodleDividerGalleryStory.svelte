<script lang="ts">
  import { doodleDividersExtension } from "@lapismd/mira/extensions";
  import { MarkdownPreview } from "@lapismd/mira/preview";
  import { twentyFourDoodleDividersMarkdown } from "./fixtures";

  const extensions = [doodleDividersExtension()];
</script>

<main class="mira-doodle-gallery-story">
  <MarkdownPreview
    value={twentyFourDoodleDividersMarkdown}
    {extensions}
    class="markdown-preview-surface markdown-rendered"
  />
</main>

<style>
  .mira-doodle-gallery-story {
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: 100%;
    padding: 1rem;
    background: var(--mira-preview-background);
  }

  .mira-doodle-gallery-story :global(.mira-markdown-preview) {
    max-inline-size: 70rem;
    margin-inline: auto;
  }
</style>
