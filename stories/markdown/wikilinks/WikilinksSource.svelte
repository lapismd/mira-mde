<script lang="ts">
  import EditorModeStory from "../_shared/EditorModeStory.svelte";
  import { wikilinksMarkdown } from "../fixtures";
</script>

<EditorModeStory value={wikilinksMarkdown} mode="source" />
