<script lang="ts">
  import type {
    MiraAssetResolver,
    MiraExtension,
    MiraFileAdapter,
    MiraFileRef,
    MiraImageConfig,
    MiraLinkResolver,
    MiraListCallout,
    MiraMarkdownAuthoringConfig,
    MiraMarkdownPostProcessor,
    MiraRendererComponents,
  } from "@lapismd/mira/extensions";
  import type { FrontmatterConfig } from "./components/frontmatter-utils";
  import EditableMarkdownSurface from "./editable-markdown-preview/editable-markdown-surface.svelte";
  import MarkdownEmbed from "./markdown-embed.svelte";

  type Props = {
    file: MiraFileRef;
    fileAdapter: MiraFileAdapter;
    editing?: boolean;
    extensions?: MiraExtension[];
    components?: MiraRendererComponents;
    class?: string;
    highlight?: boolean;
    linkResolver?: MiraLinkResolver;
    assetResolver?: MiraAssetResolver;
    imageConfig?: MiraImageConfig;
    authoring?: MiraMarkdownAuthoringConfig;
    frontmatterOpen?: boolean;
    frontmatterConfig?: FrontmatterConfig;
    headingIds?: boolean;
    headingIdPrefix?: string;
    htmlPolicy?: "trusted" | "safe";
    emoji?: boolean;
    dialog?: boolean;
    listCallouts?: MiraListCallout[];
    postProcess?: MiraMarkdownPostProcessor;
    activateOnPreviewInteraction?: boolean;
    returnToPreviewOnBlur?: boolean;
    focusEditorOnEdit?: boolean;
    onEditingChange?: (editing: boolean) => void;
    onEscape?: () => void;
    onFrontmatterChange?: (nextYaml: string, nextValue: string) => void;
  };

  let {
    file,
    fileAdapter,
    editing = $bindable(false),
    extensions = [],
    components = {},
    class: className = "",
    highlight = true,
    linkResolver,
    assetResolver,
    imageConfig,
    authoring,
    frontmatterOpen = false,
    frontmatterConfig,
    headingIds = false,
    headingIdPrefix = "",
    htmlPolicy = "trusted",
    emoji = false,
    dialog = false,
    listCallouts = [],
    postProcess,
    activateOnPreviewInteraction = true,
    returnToPreviewOnBlur = true,
    focusEditorOnEdit = true,
    onEditingChange,
    onEscape,
    onFrontmatterChange,
  }: Props = $props();

  let value = $state("");
  let loaded = $state(false);
  let loadRevision = $state(0);
  let surface: {
    flush: () => Promise<boolean>;
    exit: () => Promise<boolean>;
  } | null = $state(null);
  let previewOnChange:
    | ((replacement: string, from: number, to: number) => void)
    | undefined = $state(undefined);

  const writeMarkdown = $derived(
    fileAdapter.writeMarkdown &&
      (file.kind === undefined || file.kind === "markdown")
      ? (nextValue: string) => fileAdapter.writeMarkdown?.(file, nextValue)
      : undefined,
  );

  $effect(() => {
    const currentFile = file;
    loadRevision;
    if (!fileAdapter.readMarkdown) {
      value = "";
      loaded = true;
      return;
    }

    let cancelled = false;
    void Promise.resolve(fileAdapter.readMarkdown(currentFile)).then(
      (nextValue) => {
        if (!cancelled && nextValue !== null) {
          value = nextValue;
          loaded = true;
        }
      },
      () => {
        if (!cancelled) {
          loaded = true;
        }
      },
    );

    return () => {
      cancelled = true;
    };
  });

  $effect(() => {
    if (!fileAdapter.watchFile) {
      return;
    }
    return fileAdapter.watchFile(file, () => {
      loadRevision += 1;
    });
  });

  export async function flush(): Promise<boolean> {
    return (await surface?.flush()) ?? true;
  }

  export async function exit(): Promise<boolean> {
    return (await surface?.exit()) ?? true;
  }
</script>

{#snippet renderedPreview(markdown: string)}
  <MarkdownEmbed
    value={markdown}
    sourcePath={file.path}
    {extensions}
    {components}
    {highlight}
    {linkResolver}
    {assetResolver}
    {fileAdapter}
    {frontmatterOpen}
    {frontmatterConfig}
    {headingIds}
    {headingIdPrefix}
    {htmlPolicy}
    {emoji}
    {dialog}
    {listCallouts}
    {postProcess}
    onChange={previewOnChange}
  />
{/snippet}

{#if loaded}
  <EditableMarkdownSurface
    bind:this={surface}
    {value}
    preview={renderedPreview}
    bind:previewOnChange
    {writeMarkdown}
    bind:editing
    {extensions}
    sourcePath={file.path}
    {linkResolver}
    {assetResolver}
    {fileAdapter}
    {imageConfig}
    {authoring}
    {frontmatterOpen}
    {frontmatterConfig}
    {activateOnPreviewInteraction}
    {returnToPreviewOnBlur}
    {focusEditorOnEdit}
    class={className}
    label={`Edit ${file.name || file.path}`}
    onPersisted={(nextValue) => (value = nextValue)}
    {onEditingChange}
    {onEscape}
    {onFrontmatterChange}
  />
{:else}
  <div class={`mira-editable-markdown-preview ${className}`.trim()}>
    <span class="mira-link-preview__empty">Loading preview…</span>
  </div>
{/if}
