<script lang="ts">
  import EditorModeStory from "../_shared/EditorModeStory.svelte";
  import { mathMarkdown } from "../fixtures";
</script>

<EditorModeStory value={mathMarkdown} mode="live-preview" />
