<script lang="ts">
  import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
  import { doodleDividersExtension } from "@lapismd/mira/extensions";
  import { MarkdownPreview } from "@lapismd/mira/preview";
  import { Button } from "@lapismd/mira/ui";

  const variantSeeds = [
    "00000008",
    "00000006",
    "00000000",
    "0000000a",
    "00000001",
    "00000004",
    "00000002",
    "00000016",
  ] as const;
  const extensions = [doodleDividersExtension()];

  let seedIndex = $state(0);
  const seed = $derived(variantSeeds[seedIndex]!);
  const value = $derived(`<!-- mira-divider:v1:${seed} -->\n---\n`);

  function refreshDivider(): void {
    seedIndex = (seedIndex + 1) % variantSeeds.length;
  }
</script>

<section
  class="mira-refreshable-divider-story"
  data-current-seed={seed}
  aria-label="Refreshable doodle divider"
>
  <header>
    <div>
      <h2>Doodle divider</h2>
      <p>Stored seed <code>{seed}</code></p>
    </div>
    <Button variant="outline" onclick={refreshDivider}>
      <RefreshCwIcon data-icon="inline-start" />
      Refresh style
    </Button>
  </header>

  <div class="mira-refreshable-divider-story__preview">
    <MarkdownPreview
      {value}
      {extensions}
      class="markdown-preview-surface markdown-rendered"
    />
  </div>
</section>

<style>
  .mira-refreshable-divider-story {
    box-sizing: border-box;
    display: grid;
    gap: 1rem;
    inline-size: min(100%, 56rem);
    margin-inline: auto;
    padding: 1.25rem;
    color: var(--mira-foreground);
    background: var(--mira-background);
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  h2,
  p {
    margin: 0;
  }

  p {
    color: var(--mira-muted-foreground);
    font-size: 0.8125rem;
  }

  code {
    font-family: var(--mira-font-mono);
  }

  .mira-refreshable-divider-story__preview {
    border: 1px solid var(--mira-border);
    border-radius: var(--mira-radius);
    overflow: hidden;
    background: var(--mira-preview-background);
  }

  .mira-refreshable-divider-story__preview :global(.mira-markdown-preview) {
    min-block-size: 5rem;
  }
</style>
