<script lang="ts">
  import EditorModeStory from "../_shared/EditorModeStory.svelte";
  import { taskStatesMarkdown } from "../fixtures";
</script>

<EditorModeStory value={taskStatesMarkdown} mode="live-preview" />
