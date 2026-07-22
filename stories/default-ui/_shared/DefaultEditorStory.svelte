<script lang="ts">
  import EditorModeStory from "../../markdown/_shared/EditorModeStory.svelte";
  import type {
    MiraDefaultFeatureConfigs,
    MiraDefaultMdeProps,
    MiraDefaultToolbarDefinition,
    MiraFeatureFlags,
  } from "@mira-mde/default-ui/svelte";
  import type {
    MiraExtension,
    MiraImageConfig,
    MiraMode,
    MiraTheme,
  } from "@mira-mde/extensions";
  import { defaultUiSampleMarkdown } from "../fixtures";

  type Props = {
    /** Markdown document content. */
    value?: string;
    /** Active editor surface. */
    mode?: MiraMode;
    /** Theme tokens applied to the editor shell. */
    theme?: MiraTheme;
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
    /** Enable emoji shortcode rendering. */
    emoji?: boolean;
    /** Initial expanded state for frontmatter. */
    frontmatterOpen?: boolean;
    /** Raw HTML sanitization policy. */
    htmlPolicy?: MiraDefaultMdeProps["htmlPolicy"];
    /** Partial feature flags for packaged capabilities. */
    features?: MiraFeatureFlags;
    /** Feature-specific configuration (toolbar items, Mermaid, …). */
    featureConfigs?: MiraDefaultFeatureConfigs;
    /** Portable Mira extensions (slash, AI, custom CodeMirror). */
    extensions?: MiraExtension[];
    /** Image paste/drop/picker upload configuration. */
    imageConfig?: MiraImageConfig;
    /** Extra declarative toolbar sections. */
    toolbars?: MiraDefaultToolbarDefinition[];
    /** CSS height for the story chrome around the editor. */
    height?: string;
  };

  let {
    value = defaultUiSampleMarkdown,
    mode = "live-preview",
    theme = "light",
    readonly = false,
    lineWrapping = true,
    spellcheck = true,
    indentGuides = true,
    indentWithTabs = false,
    indentWidth = 2,
    outline = false,
    emoji = false,
    frontmatterOpen = true,
    htmlPolicy = "trusted",
    features = {},
    featureConfigs = {},
    extensions = [],
    imageConfig,
    toolbars = [],
    height = "34rem",
  }: Props = $props();
</script>

<EditorModeStory
  {value}
  {mode}
  {theme}
  {readonly}
  {lineWrapping}
  {spellcheck}
  {indentGuides}
  {indentWithTabs}
  {indentWidth}
  {outline}
  {emoji}
  {frontmatterOpen}
  {htmlPolicy}
  {features}
  {featureConfigs}
  {extensions}
  {imageConfig}
  {toolbars}
  {height}
/>
