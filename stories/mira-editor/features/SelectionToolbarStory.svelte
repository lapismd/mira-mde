<script lang="ts">
  import { onMount, tick } from "svelte";
  import { Mira, type MiraHandle } from "@lapismd/mira";
  import {
    selectionToolbarExtension,
    type MiraMode,
  } from "@lapismd/mira/extensions";

  let {
    value = $bindable(
      "Select this highlighted text to reveal contextual formatting controls.",
    ),
    mode = $bindable<MiraMode>("source"),
  }: {
    value?: string;
    mode?: MiraMode;
  } = $props();

  let editor: MiraHandle | null = $state(null);
  const extensions = [selectionToolbarExtension()];
  const selectedText = "highlighted text";

  function revealSelection(): void {
    const from = value.indexOf(selectedText);
    if (from < 0) return;
    editor?.setSelection({
      anchor: { line: 0, ch: from },
      head: { line: 0, ch: from + selectedText.length },
    });
    editor?.focus();
  }

  onMount(() => {
    void tick().then(revealSelection);
  });
</script>

<div
  class="mira-story-surface mira-story-surface--editor mira-selection-toolbar-story"
  data-selection-toolbar-story
  data-markdown-value={value}
>
  <Mira
    bind:this={editor}
    bind:value
    bind:mode
    {extensions}
    toolbar={false}
    sourcePath="selection-toolbar.md"
    spellcheck={false}
    indentWithTabs={false}
    indentWidth={2}
    class="mira-story-editor"
  />
</div>

<style>
  .mira-selection-toolbar-story {
    width: min(100%, 48rem);
    --mira-story-editor-height: 14rem;
  }
</style>
