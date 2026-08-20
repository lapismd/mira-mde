<script lang="ts">
  import { onDestroy, tick, untrack, type Snippet } from "svelte";
  import type {
    MiraAssetResolver,
    MiraExtension,
    MiraFileAdapter,
    MiraImageConfig,
    MiraLinkResolver,
    MiraMarkdownAuthoringConfig,
  } from "@lapismd/mira/extensions";
  import {
    getEditableMarkdownPreviewOffset,
    shouldActivateEditableMarkdownPreview,
    shouldReturnEditableMarkdownPreviewOnBlur,
  } from "./behavior";
  import EditorSurface from "./editor-surface.svelte";
  import {
    SerializedMarkdownWriter,
    type SerializedMarkdownWriterState,
  } from "./serialized-writer";

  type MarkdownRangeChange = (
    replacement: string,
    from: number,
    to: number,
  ) => void;

  type Props = {
    value: string;
    preview: Snippet<[string]>;
    previewOnChange?: MarkdownRangeChange;
    writeMarkdown?: (value: string) => void | Promise<void>;
    editing?: boolean;
    extensions?: MiraExtension[];
    sourcePath?: string;
    linkResolver?: MiraLinkResolver;
    assetResolver?: MiraAssetResolver;
    fileAdapter?: MiraFileAdapter;
    imageConfig?: MiraImageConfig;
    authoring?: MiraMarkdownAuthoringConfig;
    frontmatterOpen?: boolean;
    frontmatterConfig?: unknown;
    activateOnPreviewInteraction?: boolean;
    returnToPreviewOnBlur?: boolean;
    focusEditorOnEdit?: boolean;
    class?: string;
    label?: string;
    onPersisted?: (value: string) => void;
    onEditingChange?: (editing: boolean) => void;
    onEscape?: () => void;
    onFrontmatterChange?: (nextYaml: string, nextValue: string) => void;
  };

  let {
    value,
    preview,
    previewOnChange = $bindable(undefined),
    writeMarkdown,
    editing = $bindable(false),
    extensions = [],
    sourcePath,
    linkResolver,
    assetResolver,
    fileAdapter,
    imageConfig,
    authoring,
    frontmatterOpen = false,
    frontmatterConfig,
    activateOnPreviewInteraction = true,
    returnToPreviewOnBlur = true,
    focusEditorOnEdit = true,
    class: className = "",
    label = "Edit Markdown preview",
    onPersisted,
    onEditingChange,
    onEscape,
    onFrontmatterChange,
  }: Props = $props();

  let previewSurface: HTMLDivElement | null = $state(null);
  let editorSurface: HTMLDivElement | null = $state(null);
  let writer: SerializedMarkdownWriter | null = null;
  let buffer = $state("");
  let pendingOffset = $state<number | null>(null);
  let writerState = $state<SerializedMarkdownWriterState>({
    dirty: false,
    saving: false,
    error: null,
    value: "",
    persistedValue: "",
  });
  let lastExternalValue = "";
  let lastPersistedNotification = "";
  let previewScrollRatio = 0;
  let editorScrollRatio = 0;

  const writable = $derived(Boolean(writeMarkdown));

  $effect(() => {
    previewOnChange = writable ? updatePreviewRange : undefined;
    return () => {
      previewOnChange = undefined;
    };
  });

  $effect(() => {
    const write = writeMarkdown;
    const key = sourcePath;
    const initialValue = untrack(() => value);
    key;

    writer?.destroy();
    writer = null;
    buffer = initialValue;
    lastExternalValue = initialValue;
    lastPersistedNotification = initialValue;
    writerState = {
      dirty: false,
      saving: false,
      error: null,
      value: initialValue,
      persistedValue: initialValue,
    };

    if (!write) {
      editing = false;
      return;
    }

    const activeWriter = new SerializedMarkdownWriter({
      value: initialValue,
      write,
      onStateChange(state) {
        writerState = state;
        buffer = state.value;
        if (state.persistedValue !== lastPersistedNotification) {
          lastPersistedNotification = state.persistedValue;
          onPersisted?.(state.persistedValue);
        }
      },
    });
    writer = activeWriter;

    return () => {
      activeWriter.destroy();
      if (writer === activeWriter) {
        writer = null;
      }
    };
  });

  $effect(() => {
    const externalValue = value;
    if (externalValue === lastExternalValue) {
      return;
    }
    lastExternalValue = externalValue;

    if (!writer) {
      buffer = externalValue;
      writerState = {
        ...writerState,
        value: externalValue,
        persistedValue: externalValue,
      };
      return;
    }

    if (writer.replaceExternal(externalValue)) {
      buffer = externalValue;
      lastPersistedNotification = externalValue;
    }
  });

  $effect(() => {
    onEditingChange?.(editing);
    if (!editing) {
      void tick().then(restorePreviewScroll);
    }
  });

  function scrollRatio(element: HTMLElement | null): number {
    if (!element) {
      return 0;
    }
    const max = element.scrollHeight - element.clientHeight;
    return max > 0 ? element.scrollTop / max : 0;
  }

  function setScrollRatio(element: HTMLElement | null, ratio: number): void {
    if (!element) {
      return;
    }
    const max = element.scrollHeight - element.clientHeight;
    element.scrollTop = Math.max(0, max * ratio);
  }

  function getPreviewScroller(): HTMLElement | null {
    return (
      previewSurface?.querySelector<HTMLElement>(".mira-markdown-preview") ??
      previewSurface
    );
  }

  function getEditorScroller(): HTMLElement | null {
    return editorSurface?.querySelector<HTMLElement>(".cm-scroller") ?? null;
  }

  function restorePreviewScroll(): void {
    setScrollRatio(getPreviewScroller(), editorScrollRatio);
  }

  function enterEditing(offset: number | null): void {
    if (!writable || editing) {
      return;
    }
    previewScrollRatio = scrollRatio(getPreviewScroller());
    pendingOffset = offset;
    editing = true;
    void tick().then(() => {
      setScrollRatio(getEditorScroller(), previewScrollRatio);
    });
  }

  function handlePreviewClick(event: MouseEvent): void {
    if (
      !activateOnPreviewInteraction ||
      !shouldActivateEditableMarkdownPreview(
        event,
        event.currentTarget as Element,
      )
    ) {
      return;
    }

    event.preventDefault();
    enterEditing(getEditableMarkdownPreviewOffset(event));
  }

  function handlePreviewKeydown(event: KeyboardEvent): void {
    if (
      !activateOnPreviewInteraction ||
      event.target !== event.currentTarget ||
      (event.key !== "Enter" && event.key !== " ")
    ) {
      return;
    }

    event.preventDefault();
    enterEditing(null);
  }

  function updateBuffer(nextValue: string): void {
    buffer = nextValue;
    writer?.update(nextValue);
  }

  function updatePreviewRange(
    replacement: string,
    from: number,
    to: number,
  ): void {
    if (
      !writable ||
      !Number.isInteger(from) ||
      !Number.isInteger(to) ||
      from < 0 ||
      to < from ||
      to > buffer.length
    ) {
      return;
    }

    updateBuffer(`${buffer.slice(0, from)}${replacement}${buffer.slice(to)}`);
  }

  async function leaveEditing(reason: "blur" | "escape"): Promise<void> {
    if (!editing) {
      return;
    }
    editorScrollRatio = scrollRatio(getEditorScroller());
    const saved = (await writer?.flush()) ?? true;
    if (!saved) {
      return;
    }

    editing = false;
    if (reason === "escape") {
      onEscape?.();
    }
  }

  function handleEditorFocusout(event: FocusEvent): void {
    if (
      !returnToPreviewOnBlur ||
      !editorSurface ||
      !shouldReturnEditableMarkdownPreviewOnBlur(
        editorSurface,
        event.relatedTarget,
        editorSurface.ownerDocument.activeElement,
      )
    ) {
      return;
    }
    void leaveEditing("blur");
  }

  export async function flush(): Promise<boolean> {
    return (await writer?.flush()) ?? true;
  }

  export async function exit(): Promise<boolean> {
    if (!editing) {
      return true;
    }
    await leaveEditing("blur");
    return !editing;
  }

  onDestroy(() => {
    writer?.destroy();
  });
</script>

<div
  class={`mira-editable-markdown-preview ${className}`.trim()}
  data-editable-markdown-preview
  data-editing={editing ? "true" : "false"}
  data-save-state={writerState.error
    ? "error"
    : writerState.saving
      ? "saving"
      : writerState.dirty
        ? "dirty"
        : "saved"}
>
  {#if editing}
    <div
      bind:this={editorSurface}
      class="mira-editable-markdown-preview__editor-shell"
      onfocusout={handleEditorFocusout}
    >
      <EditorSurface
        value={buffer}
        {extensions}
        {sourcePath}
        {linkResolver}
        {assetResolver}
        {fileAdapter}
        {imageConfig}
        {authoring}
        {frontmatterOpen}
        {frontmatterConfig}
        selectionOffset={pendingOffset}
        focusOnMount={focusEditorOnEdit}
        onChange={updateBuffer}
        onEscape={() => void leaveEditing("escape")}
        {onFrontmatterChange}
      />
      {#if writerState.error}
        <p class="mira-editable-markdown-preview__error" role="alert">
          Could not save this note. {writerState.error.message}
        </p>
      {/if}
    </div>
  {:else if writable}
    <div
      bind:this={previewSurface}
      class="mira-editable-markdown-preview__preview"
      role="button"
      tabindex="0"
      aria-label={label}
      onclick={handlePreviewClick}
      onkeydown={handlePreviewKeydown}
    >
      {@render preview(buffer)}
    </div>
  {:else}
    <div
      bind:this={previewSurface}
      class="mira-editable-markdown-preview__preview"
    >
      {@render preview(buffer)}
    </div>
  {/if}
</div>
