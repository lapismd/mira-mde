<script lang="ts">
  import EditorModeStory from "../_shared/EditorModeStory.svelte";
  import { listsMarkdown } from "../fixtures";
</script>

<EditorModeStory value={listsMarkdown} mode="live-preview" />
