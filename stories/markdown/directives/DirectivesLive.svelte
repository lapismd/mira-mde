<script lang="ts">
  import EditorModeStory from "../_shared/EditorModeStory.svelte";
  import { directivesMarkdown } from "../fixtures";
</script>

<EditorModeStory value={directivesMarkdown} mode="live-preview" />
