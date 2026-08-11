<script lang="ts">
  import { yaml } from "@codemirror/lang-yaml";
  import {
    MiraCodeEditor,
    type MiraCodeEditorHeight,
    type MiraCodeEditorSurface,
  } from "@lapismd/mira";

  let {
    surface = "framed",
    height = "content",
  }: {
    surface?: MiraCodeEditorSurface;
    height?: MiraCodeEditorHeight;
  } = $props();

  let value = $state("name: Mira\nkind: language-neutral\n");
  let changeCount = $state(0);
  const yamlExtensions = [yaml()];
</script>

<div class:fill={height === "fill"} class="mira-code-editor-story">
  <MiraCodeEditor
    bind:value
    extensions={yamlExtensions}
    ariaLabel="YAML editor"
    {surface}
    {height}
    minHeight={height === "fill" ? "100%" : "14rem"}
    scrollerTabIndex={height === "fill" ? 0 : null}
    onChange={() => (changeCount += 1)}
  />
  <output data-testid="editor-status">
    Changes: {changeCount}; value length: {value.length}
  </output>
</div>

<style>
  .mira-code-editor-story {
    display: grid;
    gap: 0.75rem;
    max-width: 52rem;
  }

  .mira-code-editor-story.fill {
    grid-template-rows: minmax(0, 1fr) auto;
    height: 20rem;
  }

  output {
    color: var(--mira-muted-foreground);
    font: 0.75rem/1.4 var(--mira-font-sans);
  }
</style>
