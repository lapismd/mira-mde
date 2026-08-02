<script lang="ts">
  import EditorModeStory from "./EditorModeStory.svelte";
  import type { MiraMode } from "@lapismd/mira/extensions";

  type Props = {
    value: string;
    mode?: MiraMode;
  };

  let { value, mode = "live-preview" }: Props = $props();
</script>

<EditorModeStory {value} {mode} />
