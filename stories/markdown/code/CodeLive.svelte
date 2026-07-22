<script lang="ts">
  import EditorModeStory from "../_shared/EditorModeStory.svelte";
  import { codeMarkdown } from "../fixtures";
</script>

<EditorModeStory value={codeMarkdown} mode="live-preview" />
