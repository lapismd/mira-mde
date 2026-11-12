<script lang="ts">
  import { EditableMarkdownPreview } from "@lapismd/mira/preview";
  import type { MiraFileAdapter, MiraFileRef } from "@lapismd/mira/extensions";

  const file: MiraFileRef = { path: "card.md", name: "Card", kind: "markdown" };
  let value = $state(
    "# Host-controlled card\n\n[A link](https://example.com)\n\n- [ ] A task",
  );
  let editing = $state(false);
  const adapter: MiraFileAdapter = {
    resolveLink: () => null,
    readMarkdown: () => value,
    writeMarkdown: (_file, next) => {
      value = next;
    },
  };
</script>

<div class="mira-story-surface">
  <button
    type="button"
    onclick={() => {
      editing = true;
    }}>Edit card</button
  >
  <EditableMarkdownPreview
    {file}
    fileAdapter={adapter}
    activateOnPreviewInteraction={false}
    bind:editing
  />
  <output aria-label="Persisted Markdown">{value}</output>
</div>
