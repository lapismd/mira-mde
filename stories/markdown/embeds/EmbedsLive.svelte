<script lang="ts">
  import EditorModeStory from "../_shared/EditorModeStory.svelte";
  import { embedsMarkdown } from "../fixtures";
</script>

<EditorModeStory value={embedsMarkdown} mode="live-preview" />
