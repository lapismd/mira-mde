<script lang="ts">
  import { MarkdownPreview } from "@mira-mde/preview";
  import { mermaidExtension } from "@mira-mde/plugin-mermaid";
  import { specStoryHref } from "./spec-chapters";

  type Props = {
    source: string;
    sourcePath: string;
    showBanner?: boolean;
  };

  let { source, sourcePath, showBanner = false }: Props = $props();
</script>

<div class="mira-spec-page">
  {#if showBanner}
    <aside class="mira-spec-page__banner">
      <strong>Browsable mirror.</strong>
      Storybook renders canonical Markdown from <code>spec/src/</code>. Edit the
      specification, not this page, for normative changes.
    </aside>
  {/if}

  <MarkdownPreview
    value={source}
    {sourcePath}
    extensions={[mermaidExtension()]}
    linkResolver={({ href }) => specStoryHref(sourcePath, href)}
    class="markdown-preview-surface markdown-rendered mira-spec-page__content"
  />
</div>

<style>
  .mira-spec-page {
    box-sizing: border-box;
    max-width: 64rem;
    margin: 0 auto;
    padding: 2rem;
  }

  .mira-spec-page__banner {
    max-width: 52rem;
    margin: 0 0 1.5rem;
    padding: 0.75rem 1rem;
    border: 1px solid var(--mira-border);
    border-radius: var(--mira-radius);
    background: var(--mira-muted);
    color: var(--mira-muted-foreground);
    line-height: 1.5;
  }

  .mira-spec-page :global(.mira-spec-page__content) {
    --mira-preview-padding: 0;
    --mira-preview-bottom-padding: 2rem;

    max-width: 52rem;
  }
</style>
