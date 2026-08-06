<script lang="ts">
  import { MiraEditor, type MiraEditorHandle } from "@lapismd/mira-editor";
  import type { MiraEditorSelection } from "@lapismd/mira/core";
  import {
    selectionToolbarExtension,
    type MiraMode,
  } from "@lapismd/mira/extensions";

  type SetupDetail = {
    markdown: string;
    selection: MiraEditorSelection;
  };

  let {
    value = $bindable("Toolbar action target"),
    mode = $bindable<MiraMode>("source"),
  }: {
    value?: string;
    mode?: MiraMode;
  } = $props();

  let editor: MiraEditorHandle | null = $state(null);
  const extensions = [selectionToolbarExtension()];

  function markdownActionHarness(node: HTMLElement) {
    const setup = (event: Event) => {
      const { markdown, selection } = (event as CustomEvent<SetupDetail>)
        .detail;
      editor?.setMarkdown(markdown);
      editor?.setSelection(selection);
      editor?.focus();
    };
    node.addEventListener("mira-story-setup-markdown-action", setup);
    return {
      destroy() {
        node.removeEventListener("mira-story-setup-markdown-action", setup);
      },
    };
  }
</script>

<div
  class="mira-story-surface mira-story-surface--editor mira-toolbar-actions-story"
  data-markdown-toolbar-actions
  data-markdown-value={value}
  data-mode={mode}
  use:markdownActionHarness
>
  <MiraEditor
    bind:this={editor}
    bind:value
    bind:mode
    sourcePath="toolbar-actions.md"
    {extensions}
    spellcheck={false}
    indentWithTabs={false}
    indentWidth={2}
    class="mira-story-editor"
  />
</div>

<style>
  .mira-toolbar-actions-story {
    width: min(100%, 52rem);
    --mira-story-editor-height: 22rem;
  }
</style>
