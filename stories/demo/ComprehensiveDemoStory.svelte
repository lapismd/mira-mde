<script lang="ts">
  import {
    MiraEditor,
    MiraFeature,
    type MiraFeatureFlags,
    type MiraOutlineVariant,
  } from "@lapismd/mira-editor";
  import {
    selectionToolbarExtension,
    type MiraColorMode,
    type MiraMode,
    type MiraTheme,
  } from "@lapismd/mira/extensions";
  import { mermaidExtension } from "@lapismd/mira-plugin-mermaid";
  import { Mira } from "@lapismd/mira";
  import { storyFileAdapter } from "../markdown/_shared/file-adapter";

  type EditorShell = "default" | "composable";

  type Props = {
    value: string;
    mode?: MiraMode;
    theme?: MiraTheme;
    colorMode?: MiraColorMode;
    editorShell?: EditorShell;
    mermaidEnabled?: boolean;
    outline?: boolean;
    outlineVariant?: MiraOutlineVariant;
    indentGuides?: boolean;
    indentWithTabs?: boolean;
    indentWidth?: number;
    height?: string;
  };

  let {
    value = $bindable(""),
    mode = $bindable<MiraMode>("live-preview"),
    theme,
    colorMode = "inherit",
    editorShell = "default",
    mermaidEnabled = true,
    outline = true,
    outlineVariant = "floating",
    indentGuides = true,
    indentWithTabs = true,
    indentWidth = 4,
    height = "min(68rem, calc(100vh - 5rem))",
  }: Props = $props();

  const selectionToolbar = selectionToolbarExtension();
  const defaultExtensions = [selectionToolbar];
  const extensions = $derived([
    selectionToolbar,
    ...(mermaidEnabled ? [mermaidExtension()] : []),
  ]);
  const features = $derived({
    [MiraFeature.Mermaid]: mermaidEnabled,
  } satisfies MiraFeatureFlags);
  const wordCount = $derived(value.trim().split(/\s+/).filter(Boolean).length);
</script>

<div
  class:dark={colorMode === "dark"}
  class:theme-dark={colorMode === "dark"}
  class:light={colorMode === "light"}
  class:theme-light={colorMode === "light"}
  class="mira-comprehensive"
  data-mira-theme={theme?.trim() ? theme : undefined}
  data-mira-color-mode={colorMode === "inherit" ? undefined : colorMode}
>
  <header class="mira-comprehensive__header">
    <div>
      <h1>Mira</h1>
      <p>Comprehensive portable Markdown playground</p>
    </div>
    <dl aria-label="Playground state">
      <div>
        <dt>Shell</dt>
        <dd>{editorShell}</dd>
      </div>
      <div>
        <dt>View</dt>
        <dd>{mode}</dd>
      </div>
      <div>
        <dt>Words</dt>
        <dd>{wordCount}</dd>
      </div>
    </dl>
  </header>

  <main
    class="mira-comprehensive__main"
    style={`--mira-demo-height: ${height}`}
  >
    {#if editorShell === "default"}
      <MiraEditor
        bind:value
        bind:mode
        {theme}
        {colorMode}
        sourcePath="comprehensive-demo.md"
        fileAdapter={storyFileAdapter}
        {outline}
        {outlineVariant}
        {features}
        extensions={defaultExtensions}
        {indentGuides}
        {indentWithTabs}
        {indentWidth}
        class="mira-comprehensive__editor"
      />
    {:else}
      <Mira
        bind:value
        bind:mode
        {theme}
        {colorMode}
        sourcePath="comprehensive-demo.md"
        fileAdapter={storyFileAdapter}
        {outline}
        {outlineVariant}
        {extensions}
        {indentGuides}
        {indentWithTabs}
        {indentWidth}
        class="mira-comprehensive__editor"
      />
    {/if}
  </main>
</div>

<style>
  .mira-comprehensive {
    box-sizing: border-box;
    min-height: 100vh;
    padding: 1.25rem;
    background: var(--mira-background);
    color: var(--mira-foreground);
  }

  .mira-comprehensive__header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    max-width: 96rem;
    margin: 0 auto 1rem;
  }

  .mira-comprehensive__header h1,
  .mira-comprehensive__header p,
  .mira-comprehensive__header dl,
  .mira-comprehensive__header dd {
    margin: 0;
  }

  .mira-comprehensive__header h1 {
    font-size: 1.25rem;
    letter-spacing: -0.025em;
  }

  .mira-comprehensive__header p,
  .mira-comprehensive__header dt {
    color: var(--mira-muted-foreground);
    font-size: 0.75rem;
  }

  .mira-comprehensive__header dl {
    display: flex;
    gap: 1.25rem;
  }

  .mira-comprehensive__header dl div {
    text-align: right;
  }

  .mira-comprehensive__header dd {
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .mira-comprehensive__main {
    height: var(--mira-demo-height);
    max-width: 96rem;
    margin: 0 auto;
    overflow: hidden;
    border: 1px solid var(--mira-border);
    border-radius: var(--mira-radius);
    background: var(--mira-background);
    box-shadow: var(--mira-shadow-sm);
  }

  .mira-comprehensive__main :global(.mira-comprehensive__editor) {
    height: 100%;
    min-height: 0;
  }

  @media (max-width: 48rem) {
    .mira-comprehensive__header {
      align-items: flex-start;
      flex-direction: column;
    }

    .mira-comprehensive__header dl {
      width: 100%;
    }

    .mira-comprehensive__header dl div {
      text-align: left;
    }
  }
</style>
