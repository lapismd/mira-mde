<script lang="ts">
  import EditorModeStory from "../_shared/EditorModeStory.svelte";
  import { frontmatterMarkdown } from "../fixtures";
</script>

<EditorModeStory value={frontmatterMarkdown} mode="live-preview" />
