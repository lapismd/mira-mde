<script lang="ts">
  import EditorModeStory from "../_shared/EditorModeStory.svelte";
  import { rawHtmlMarkdown } from "../fixtures";
</script>

<EditorModeStory value={rawHtmlMarkdown} mode="live-preview" />
