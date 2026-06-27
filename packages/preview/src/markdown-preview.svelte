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
    remarkPositionsToData,
    remarkTags,
    remarkWikiLinks,
  } from "./remark";
  import Callout from "./components/callout.svelte";
  import Embed from "./components/embed.svelte";
  import Frontmatter from "./components/frontmatter.svelte";
  import Image from "./components/image.svelte";
  import Link from "./components/link.svelte";
  import Tag from "./components/tag.svelte";
  import type { Pluggable } from "unified";

  type Props = {
    value: string;
    sourcePath?: string;
    extensions?: MiraExtension[];
    components?: MiraRendererComponents;
    class?: string;
    inline?: boolean;
    highlight?: boolean;
    linkResolver?: MiraLinkResolver;
    assetResolver?: MiraAssetResolver;
  };

  let {
    value,
    sourcePath,
    extensions = [],
    components = {},
    class: className = "",
    inline = false,
    highlight = true,
    linkResolver,
    assetResolver,
  }: Props = $props();

  const builtInComponents: MiraRendererComponents = {
    callout: Callout,
    embed: Embed,
    frontmatter: Frontmatter,
    img: Image,
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
    remarkPositionsToData,
    ...resolvedExtensions.remarkPlugins,
  ]);

  const rehypePlugins = $derived<Pluggable[]>([
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
  />
{:else}
  <div
    class={`mira-markdown-preview markdown-preview-surface markdown-rendered ${className}`.trim()}
  >
    <Markdown
      {value}
      {sourcePath}
      {remarkPlugins}
      {rehypePlugins}
      components={componentMap}
      {linkResolver}
      {assetResolver}
    />
  </div>
{/if}
