<script lang="ts">
  import EditorModeStory from "../_shared/EditorModeStory.svelte";
  import { blockquotesMarkdown } from "../fixtures";
</script>

<EditorModeStory value={blockquotesMarkdown} mode="live-preview" />
