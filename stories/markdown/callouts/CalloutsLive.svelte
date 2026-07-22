<script lang="ts">
  import EditorModeStory from "../_shared/EditorModeStory.svelte";
  import { calloutsMarkdown } from "../fixtures";
</script>

<EditorModeStory value={calloutsMarkdown} mode="live-preview" />
