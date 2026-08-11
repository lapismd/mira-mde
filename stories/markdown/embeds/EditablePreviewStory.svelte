<script lang="ts">
  import { EditableMarkdownPreview } from "@lapismd/mira/preview";
  import type { MiraFileAdapter, MiraFileRef } from "@lapismd/mira/extensions";

  const file: MiraFileRef = {
    kind: "markdown",
    name: "Editable Preview",
    path: "notes/editable-preview.md",
  };
  let storedValue = $state(
    "# Editable Preview\n\nClick this rendered paragraph to edit the note in place.",
  );
  let editing = $state(false);

  const fileAdapter: MiraFileAdapter = {
    resolveLink() {
      return file;
    },
    readMarkdown() {
      return storedValue;
    },
    async writeMarkdown(_file, value) {
      storedValue = value;
    },
  };
</script>

<div class="mira-story-surface mira-editable-preview-story">
  <p class="mira-story-kicker">
    {editing ? "Editing is pinned open" : "Rendered preview"}
  </p>
  <EditableMarkdownPreview {file} {fileAdapter} bind:editing />
  <output aria-label="Persisted Markdown">{storedValue}</output>
</div>
