import type { ArgTypes } from "@storybook/svelte-vite";
import { defaultUiSampleMarkdown } from "../fixtures";

export type DefaultEditorStoryProps = {
  value?: string;
  mode?: "source" | "live-preview" | "preview" | "split";
  theme?: "obsidian" | "system" | "light" | "dark" | "inherit";
  readonly?: boolean;
  lineWrapping?: boolean;
  spellcheck?: boolean;
  indentGuides?: boolean;
  indentWithTabs?: boolean;
  indentWidth?: number;
  outline?: boolean;
  outlineVariant?: "floating" | "sidebar";
  emoji?: boolean;
  frontmatterOpen?: boolean;
  htmlPolicy?: "trusted" | "safe";
  height?: string;
};

export const defaultEditorArgs: DefaultEditorStoryProps = {
  value: defaultUiSampleMarkdown,
  mode: "live-preview",
  theme: "light",
  readonly: false,
  lineWrapping: true,
  spellcheck: true,
  indentGuides: true,
  indentWithTabs: false,
  indentWidth: 2,
  outline: false,
  outlineVariant: "floating",
  emoji: false,
  frontmatterOpen: true,
  htmlPolicy: "trusted",
  height: "34rem",
};

/** Full public API snippet shown in docs instead of `<DefaultEditorStory />`. */
export const defaultEditorDocsSource = `<script lang="ts">
  import { MiraDefaultMde } from "@mira-mde/default-ui/svelte";
  import type { MiraMode } from "@mira-mde/extensions";

  let value = $state("# Hello Mira");
  let mode = $state<MiraMode>("live-preview");
</script>

<MiraDefaultMde
  bind:value
  bind:mode
  theme="light"
  indentGuides
/>`;

export const defaultEditorDocsParameters = {
  docs: {
    source: {
      language: "html",
      type: "code" as const,
      code: defaultEditorDocsSource,
    },
  },
};

/** Controls surface matching MiraDefaultMde public configuration props. */
export const defaultEditorArgTypes = {
  value: {
    control: "text",
    description: "Markdown document content.",
    table: { category: "Content" },
  },
  mode: {
    control: "select",
    options: ["source", "live-preview", "preview", "split"],
    description: "Active editor surface.",
    table: { category: "Mode", type: { summary: "MiraMode" } },
  },
  theme: {
    control: "select",
    options: ["light", "dark", "obsidian", "system", "inherit"],
    description: "Theme tokens applied to the editor shell.",
    table: { category: "Appearance", type: { summary: "MiraTheme" } },
  },
  height: {
    control: "text",
    description: "CSS height for the story chrome around the editor.",
    table: { category: "Appearance" },
  },
  readonly: {
    control: "boolean",
    description: "Disable editing while keeping the current mode.",
    table: { category: "Editing" },
  },
  lineWrapping: {
    control: "boolean",
    description: "Wrap long source lines.",
    table: { category: "Editing" },
  },
  spellcheck: {
    control: "boolean",
    description: "Enable browser spellcheck in source surfaces.",
    table: { category: "Editing" },
  },
  indentGuides: {
    control: "boolean",
    description: "Show indent guides in the source editor.",
    table: { category: "Indentation" },
  },
  indentWithTabs: {
    control: "boolean",
    description: "Prefer tabs over spaces when indenting.",
    table: { category: "Indentation" },
  },
  indentWidth: {
    control: { type: "number", min: 1, max: 8, step: 1 },
    description: "Indent size in columns.",
    table: { category: "Indentation" },
  },
  outline: {
    control: "boolean",
    description: "Show the document outline in reading and split views.",
    table: { category: "Reading" },
  },
  outlineVariant: {
    control: "inline-radio",
    options: ["floating", "sidebar"],
    description: "Use the floating marker rail or persistent side panel.",
    table: {
      category: "Reading",
      type: { summary: '"floating" | "sidebar"' },
    },
  },
  emoji: {
    control: "boolean",
    description: "Enable emoji shortcode rendering.",
    table: { category: "Reading" },
  },
  frontmatterOpen: {
    control: "boolean",
    description: "Initial expanded state for frontmatter.",
    table: { category: "Reading" },
  },
  htmlPolicy: {
    control: "select",
    options: ["trusted", "safe"],
    description: "Raw HTML sanitization policy.",
    table: { category: "Reading", type: { summary: '"trusted" | "safe"' } },
  },
  features: {
    control: "object",
    description:
      "Partial MiraFeatureFlags map enabling/disabling packaged capabilities.",
    table: { category: "Features", type: { summary: "MiraFeatureFlags" } },
  },
  featureConfigs: {
    control: "object",
    description:
      "Feature-specific configuration such as toolbar items and Mermaid options.",
    table: {
      category: "Features",
      type: { summary: "MiraDefaultFeatureConfigs" },
    },
  },
  extensions: {
    control: false,
    description: "Portable Mira extensions (slash, AI, custom CodeMirror).",
    table: {
      category: "Extensions",
      type: { summary: "MiraExtension[]" },
    },
  },
  imageConfig: {
    control: "object",
    description:
      "Image paste/drop/picker config (upload, MIME types, reference vs inline syntax).",
    table: {
      category: "Extensions",
      type: { summary: "MiraImageConfig" },
    },
  },
  toolbars: {
    control: false,
    description:
      "Extra declarative toolbar sections appended to the default toolbar.",
    table: {
      category: "Features",
      type: { summary: "MiraDefaultToolbarDefinition[]" },
    },
  },
} satisfies Partial<
  ArgTypes<DefaultEditorStoryProps & Record<string, unknown>>
>;
