<script lang="ts">
  import EditorModeStory from "../../markdown/_shared/EditorModeStory.svelte";
  import type {
    MiraEditorFeatureConfigs,
    MiraEditorProps,
    MiraEditorToolbarDefinition,
    MiraFeatureFlags,
  } from "@lapismd/mira-editor";
  import type {
    MiraExtension,
    MiraImageConfig,
    MiraMarkdownAuthoringConfig,
    MiraMode,
    MiraColorMode,
    MiraTheme,
  } from "@lapismd/mira/extensions";
  import { miraEditorSampleMarkdown } from "../fixtures";

  type Props = {
    /** Markdown document content. */
    value?: string;
    /** Active editor surface. */
    mode?: MiraMode;
    /** Current Markdown file path for relative links and completion. */
    sourcePath?: string;
    /** Theme tokens applied to the editor shell. */
    theme?: MiraTheme;
    /** Color-mode override independent from the selected theme. */
    colorMode?: MiraColorMode;
    /** Story-only page palette used to demonstrate inheritance and islands. */
    pageTheme?: MiraTheme;
    /** Story-only page color mode used to demonstrate inheritance and islands. */
    pageColorMode?: MiraColorMode;
    /** Disable editing while keeping the current mode. */
    readonly?: boolean;
    /** Wrap long source lines. */
    lineWrapping?: boolean;
    /** Enable browser spellcheck in source surfaces. */
    spellcheck?: boolean;
    /** Show indent guides in the source editor. */
    indentGuides?: boolean;
    /** Prefer tabs over spaces when indenting. */
    indentWithTabs?: boolean;
    /** Indent size in columns. */
    indentWidth?: number;
    /** Show the document outline beside the editor. */
    outline?: boolean;
    /** Choose the floating marker rail or persistent sidebar outline. */
    outlineVariant?: MiraEditorProps["outlineVariant"];
    /** Enable emoji shortcode rendering. */
    emoji?: boolean;
    /** Initial expanded state for frontmatter. */
    frontmatterOpen?: boolean;
    /** Raw HTML sanitization policy. */
    htmlPolicy?: MiraEditorProps["htmlPolicy"];
    /** Partial feature flags for packaged capabilities. */
    features?: MiraFeatureFlags;
    /** Feature-specific configuration (toolbar items, Mermaid, …). */
    featureConfigs?: MiraEditorFeatureConfigs;
    /** Portable Mira extensions (slash, AI, custom CodeMirror). */
    extensions?: MiraExtension[];
    /** Image paste/drop/picker upload configuration. */
    imageConfig?: MiraImageConfig;
    authoring?: MiraMarkdownAuthoringConfig;
    /** Extra declarative toolbar sections. */
    toolbars?: MiraEditorToolbarDefinition[];
    /** CSS height for the story chrome around the editor. */
    height?: string;
  };

  let {
    value = miraEditorSampleMarkdown,
    mode = "live-preview",
    sourcePath = "story.md",
    theme,
    colorMode = "inherit",
    pageTheme,
    pageColorMode,
    readonly = false,
    lineWrapping = true,
    spellcheck = true,
    indentGuides = true,
    indentWithTabs = false,
    indentWidth = 2,
    outline = false,
    outlineVariant = "floating",
    emoji = false,
    frontmatterOpen = true,
    htmlPolicy = "trusted",
    features = {},
    featureConfigs = {},
    extensions = [],
    imageConfig,
    authoring,
    toolbars = [],
    height = "34rem",
  }: Props = $props();
</script>

{#snippet editor()}
  <EditorModeStory
    {value}
    {mode}
    {sourcePath}
    {theme}
    {colorMode}
    {readonly}
    {lineWrapping}
    {spellcheck}
    {indentGuides}
    {indentWithTabs}
    {indentWidth}
    {outline}
    {outlineVariant}
    {emoji}
    {frontmatterOpen}
    {htmlPolicy}
    {features}
    {featureConfigs}
    {extensions}
    {imageConfig}
    {authoring}
    {toolbars}
    {height}
  />
{/snippet}

{#if pageTheme || (pageColorMode && pageColorMode !== "inherit")}
  <div
    class="mira-story-appearance-page"
    class:dark={pageColorMode === "dark"}
    class:theme-dark={pageColorMode === "dark"}
    class:light={pageColorMode === "light"}
    class:theme-light={pageColorMode === "light"}
    data-mira-theme={pageTheme || undefined}
    data-mira-color-mode={pageColorMode && pageColorMode !== "inherit"
      ? pageColorMode
      : undefined}
  >
    {@render editor()}
  </div>
{:else}
  {@render editor()}
{/if}

<style>
  .mira-story-appearance-page {
    min-height: 100%;
    padding: 1rem;
    color: var(--mira-foreground);
    background: var(--mira-background);
  }
</style>
