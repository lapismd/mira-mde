<script lang="ts">
  import EditorModeStory from "../_shared/EditorModeStory.svelte";
  import { imagesMarkdown } from "../fixtures";
</script>

<EditorModeStory value={imagesMarkdown} mode="live-preview" />
