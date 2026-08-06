<script lang="ts">
  import { onMount, tick } from "svelte";
  import SparklesIcon from "@lucide/svelte/icons/sparkles";
  import {
    MiraEditor,
    type MiraEditorHandle,
    type MiraEditorToolbarButtonAction,
  } from "@lapismd/mira-editor";
  import type { MiraMode } from "@lapismd/mira/extensions";

  let {
    value = $bindable(
      `- [?] Custom task

# Heading one

## Heading two

### Heading three

Paragraph block

This deliberately long wrapped paragraph demonstrates that the block trigger remains aligned with the first visual row while the content continues naturally onto additional rows inside a constrained editor surface.

- Bullet item

> Quoted block

\`\`\`ts
const richBlock = true;
\`\`\``,
    ),
    mode = $bindable<MiraMode>("source"),
    openMenu = false,
  }: {
    value?: string;
    mode?: MiraMode;
    openMenu?: boolean;
  } = $props();

  let editor: MiraEditorHandle | null = $state(null);
  let root: HTMLElement | null = $state(null);

  const customAction: MiraEditorToolbarButtonAction = {
    id: "mark-block",
    label: "Mark block",
    group: "Custom",
    icon: SparklesIcon,
    placements: ["block-menu"],
    shortcut: "⌘M",
    run(context) {
      if (!context.block || !context.replaceRange) return;
      context.replaceRange(`✨ ${context.block.text}`, context.block);
    },
  };

  async function setActiveBlock(
    markdown: string,
    line: number,
    ch: number,
  ): Promise<void> {
    editor?.setMarkdown(markdown);
    await tick();
    editor?.setSelection({
      anchor: { line, ch },
      head: { line, ch },
    });
    editor?.focus();
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }

  onMount(() => {
    const handleSetup = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          markdown: string;
          line: number;
          ch: number;
        }>
      ).detail;
      void setActiveBlock(detail.markdown, detail.line, detail.ch);
    };
    root?.addEventListener("mira-story-set-active-block", handleSetup);

    if (openMenu) {
      const wrappedLine = value
        .slice(0, value.indexOf("This deliberately"))
        .split("\n").length;
      void setActiveBlock(value, wrappedLine - 1, 5).then(() => {
        root
          ?.querySelector<HTMLButtonElement>(
            ".mira-block-toolbar-trigger--active",
          )
          ?.click();
      });
    }

    return () => {
      root?.removeEventListener("mira-story-set-active-block", handleSetup);
    };
  });
</script>

<div
  bind:this={root}
  class="mira-story-surface mira-story-surface--editor mira-block-toolbar-story"
  data-block-toolbar-story
  data-markdown-value={value}
>
  <MiraEditor
    bind:this={editor}
    bind:value
    bind:mode
    features={{ toolbar: false }}
    featureConfigs={{ "block-controls": { toolbar: true } }}
    toolbarActions={[customAction]}
    sourcePath="block-toolbar.md"
    spellcheck={false}
    indentWithTabs={false}
    indentWidth={2}
    class="mira-story-editor"
  />
</div>

<style>
  .mira-block-toolbar-story {
    width: min(100%, 46rem);
    --mira-story-editor-height: 31rem;
  }
</style>
