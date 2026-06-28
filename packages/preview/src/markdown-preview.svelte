<script lang="ts">
  import rehypeHighlight from "rehype-highlight";
  import rehypeKatex from "rehype-katex";
  import rehypeRaw from "rehype-raw";
  import remarkDirective from "remark-directive";
  import remarkFrontmatter from "remark-frontmatter";
  import remarkGfm from "remark-gfm";
  import remarkMath from "remark-math";
  import type {
    MiraAssetResolver,
    MiraExtension,
    MiraLinkResolver,
    MiraRendererComponents,
  } from "@mira-mde/extensions";
  import { resolveMiraExtensions } from "@mira-mde/extensions";
  import Markdown from "./renderer/markdown.svelte";
  import {
    remarkCallouts,
    remarkDirectivesToHast,
    remarkFrontmatterToHast,
    remarkPositionsToData,
    remarkTags,
    remarkWikiLinks,
  } from "./remark";
  import Callout from "./components/callout.svelte";
  import Checkbox from "./components/checkbox.svelte";
  import Code from "./components/code.svelte";
  import Embed from "./components/embed.svelte";
  import Frontmatter from "./components/frontmatter.svelte";
  import Image from "./components/image.svelte";
  import ListItem from "./components/list-item.svelte";
  import Link from "./components/link.svelte";
  import Tag from "./components/tag.svelte";
  import rehypeCodeContext from "./rehype-code-context";
  import type { Pluggable } from "unified";

  type Props = {
    value: string;
    sourcePath?: string;
    extensions?: MiraExtension[];
    components?: MiraRendererComponents;
    class?: string;
    inline?: boolean;
    embed?: boolean;
    highlight?: boolean;
    linkResolver?: MiraLinkResolver;
    assetResolver?: MiraAssetResolver;
    frontmatterOpen?: boolean;
    onChange?: (replacement: string, from: number, to: number) => void;
    onFrontmatterChange?: (nextYaml: string, nextValue: string) => void;
  };

  let {
    value,
    sourcePath,
    extensions = [],
    components = {},
    class: className = "",
    inline = false,
    embed = false,
    highlight = true,
    linkResolver,
    assetResolver,
    frontmatterOpen = true,
    onChange,
    onFrontmatterChange,
  }: Props = $props();

  const builtInComponents: MiraRendererComponents = {
    callout: Callout,
    code: Code,
    embed: Embed,
    frontmatter: Frontmatter,
    img: Image,
    input: Checkbox,
    li: ListItem,
    pathlink: Link,
    tag: Tag,
    wikilink: Link,
  };

  const resolvedExtensions = $derived(
    resolveMiraExtensions(extensions, {
      mode: "preview",
      readonly: true,
      sourcePath,
    }),
  );

  const remarkPlugins = $derived<Pluggable[]>([
    remarkFrontmatter,
    remarkDirective,
    remarkGfm,
    remarkMath,
    remarkWikiLinks,
    remarkTags,
    remarkCallouts,
    remarkDirectivesToHast,
    remarkFrontmatterToHast,
    remarkPositionsToData,
    ...resolvedExtensions.remarkPlugins,
  ]);

  const rehypePlugins = $derived<Pluggable[]>([
    rehypeCodeContext,
    ...(highlight ? [rehypeHighlight] : []),
    rehypeRaw,
    rehypeKatex,
    ...resolvedExtensions.rehypePlugins,
  ]);

  const componentMap = $derived({
    ...builtInComponents,
    ...resolvedExtensions.components,
    ...components,
  });
</script>

{#if inline}
  <Markdown
    {value}
    {sourcePath}
    {remarkPlugins}
    {rehypePlugins}
    components={componentMap}
    {linkResolver}
    {assetResolver}
    {frontmatterOpen}
    {onChange}
    {onFrontmatterChange}
  />
{:else}
  <div
    class={`mira-markdown-preview markdown-reading-view markdown-preview-surface markdown-preview-surface--reading markdown-rendered flex flex-col gap-5 p-9 ${embed ? "markdown-preview-surface--embedded markdown-embed-surface" : ""} ${className}`.trim()}
    data-markdown-embed={embed ? true : undefined}
  >
    <div class="cm-sizer flex flex-col gap-5 empty:hidden">
      <div
        class={`markdown-view__document markdown ${embed ? "pb-0" : "pb-[50svh]"}`}
      >
        <Markdown
          {value}
          {sourcePath}
          {remarkPlugins}
          {rehypePlugins}
          components={componentMap}
          {linkResolver}
          {assetResolver}
          {frontmatterOpen}
          {onChange}
          {onFrontmatterChange}
        />
      </div>
    </div>
  </div>
{/if}
