<script lang="ts">
  import { onMount, tick } from "svelte";
  import { MiraEditor, type MiraEditorHandle } from "@lapismd/mira-editor";
  import type { MiraEditorSelection } from "@lapismd/mira/core";
  import type { MiraMode } from "@lapismd/mira/extensions";
  import { storyFileAdapter } from "../_shared/file-adapter";

  type Props = {
    value: string;
    mode?: MiraMode;
    initialSelection?: MiraEditorSelection;
    height?: string;
    width?: string;
    indentGuides?: boolean;
    indentWithTabs?: boolean;
    indentWidth?: number;
  };

  let {
    value = $bindable(""),
    mode = $bindable<MiraMode>("live-preview"),
    initialSelection,
    height = "30rem",
    width = "36rem",
    indentGuides = true,
    indentWithTabs = true,
    indentWidth = 4,
  }: Props = $props();

  let editor: MiraEditorHandle | null = $state(null);

  onMount(async () => {
    if (!initialSelection) return;
    await tick();
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    editor?.setSelection(initialSelection);
    editor?.focus();
  });
</script>

<div
  class="mira-story-surface mira-story-surface--editor mira-indentation-story"
  data-indentation-story
  tabindex="-1"
  style={`--mira-story-editor-height: ${height}; max-width: 100%; width: ${width};`}
>
  <MiraEditor
    bind:this={editor}
    bind:value
    bind:mode
    sourcePath="indentation.md"
    lineWrapping
    spellcheck={false}
    {indentGuides}
    {indentWithTabs}
    {indentWidth}
    fileAdapter={storyFileAdapter}
    class="mira-story-editor"
  />
</div>
