<script lang="ts">
  import { MarkdownPreview } from "@lapismd/mira/preview";
  import type { MiraFileAdapter } from "@lapismd/mira/extensions";

  let release!: () => void;
  const activation = new Promise<void>((resolve) => {
    release = resolve;
  });
  let showCancelled = $state(true);
  let showActive = $state(true);
  let cancelled = $state(0);
  let mounted = $state(0);
  let destroyed = $state(0);
  const adapter: MiraFileAdapter = {
    resolveLink: ({ path }) => ({ path, name: path, kind: "markdown" }),
    readMarkdown: () => "Ordinary fallback content.",
    async renderEmbed(target, element, context) {
      if (target.file.path === "Fallback.md") return false;
      await activation;
      if (context?.signal.aborted) {
        cancelled += 1;
        return false;
      }
      const content = document.createElement("p");
      content.textContent = "Activated custom content.";
      element.replaceChildren(content);
      mounted += 1;
      return () => {
        destroyed += 1;
        content.remove();
      };
    },
  };
</script>

<div class="mira-story-surface mira-story-surface--preview">
  <div class="mira-story-actions">
    <button
      type="button"
      onclick={() => {
        showCancelled = false;
      }}>Remove pending embed</button
    >
    <button type="button" onclick={() => release()}
      >Activate embedded renderer</button
    >
    <button
      type="button"
      onclick={() => {
        showActive = false;
      }}>Remove active embed</button
    >
  </div>
  <output aria-label="Cancelled renders">{cancelled}</output>
  <output aria-label="Mounted renders">{mounted}</output>
  <output aria-label="Destroyed renders">{destroyed}</output>
  {#if showActive}
    <MarkdownPreview
      value="![[Async.md]]"
      fileAdapter={adapter}
      sourcePath="Source.md"
    />
  {/if}
  <MarkdownPreview
    value="![[Fallback.md]]"
    fileAdapter={adapter}
    sourcePath="Source.md"
  />
  {#if showCancelled}
    <MarkdownPreview
      value="![[Cancelled.md]]"
      fileAdapter={adapter}
      sourcePath="Source.md"
    />
  {/if}
</div>
