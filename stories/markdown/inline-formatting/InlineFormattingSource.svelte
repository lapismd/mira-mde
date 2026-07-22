<script lang="ts">
  import EditorModeStory from "../_shared/EditorModeStory.svelte";
  import { inlineFormattingMarkdown } from "../fixtures";
</script>

<EditorModeStory value={inlineFormattingMarkdown} mode="source" />
