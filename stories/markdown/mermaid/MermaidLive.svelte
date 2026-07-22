<script lang="ts">
  import EditorModeStory from "../_shared/EditorModeStory.svelte";
  import { mermaidMarkdownFeature } from "../fixtures";
</script>

<EditorModeStory value={mermaidMarkdownFeature} mode="live-preview" />
