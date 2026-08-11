<script lang="ts">
  import Markdown from "../renderer/markdown.svelte";
  import { useMarkdownContext } from "../renderer/context.svelte";

  type Props = {
    value: string;
    sourcePath?: string;
    class?: string;
    frontmatterOpen?: boolean;
    ref?: HTMLElement | null;
  };

  let {
    value,
    sourcePath,
    class: className = "",
    frontmatterOpen = false,
    ref = $bindable(null),
  }: Props = $props();
  const markdown = useMarkdownContext();
  const activeSourcePath = $derived(sourcePath || markdown.sourcePath);
</script>

<div
  bind:this={ref}
  class={`mira-embedded-markdown-preview mira-markdown-preview markdown-reading-view markdown-preview-surface markdown-preview-surface--embedded markdown-embed-surface markdown-rendered ${className}`.trim()}
  data-markdown-embed="true"
>
  <div class="cm-sizer">
    <div class="markdown-view__document markdown">
      <Markdown
        {value}
        sourcePath={activeSourcePath}
        extensions={markdown.extensions}
        remarkPlugins={markdown.remarkPlugins}
        rehypePlugins={markdown.rehypePlugins}
        remarkRehypeOptions={markdown.remarkRehypeOptions}
        components={markdown.components}
        linkResolver={markdown.linkResolver}
        assetResolver={markdown.assetResolver}
        fileAdapter={markdown.fileAdapter}
        listCallouts={markdown.listCallouts}
        postProcess={markdown.postProcess}
        {frontmatterOpen}
        frontmatterConfig={markdown.frontmatterConfig}
        dialog={markdown.dialog}
      />
    </div>
  </div>
</div>
