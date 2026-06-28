<script lang="ts">
  import rehypeHighlight from "rehype-highlight";
  import rehypeKatex from "rehype-katex";
  import rehypeRaw from "rehype-raw";
  import remarkGridTables from "@adobe/remark-gridtables";
  import {
    TYPE_TABLE,
    mdast2hastGridTablesHandler,
  } from "@adobe/mdast-util-gridtables";
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
    remarkCustomChecklists,
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
  import type { Options as RemarkRehypeOptions } from "remark-rehype";
  import type { FrontmatterConfig } from "./components/frontmatter-utils";

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
    frontmatterConfig?: FrontmatterConfig;
    dialog?: boolean;
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
    frontmatterConfig,
    dialog = false,
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
    remarkGridTables,
    remarkGfm,
    remarkCustomChecklists,
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

  const remarkRehypeOptions = $derived<RemarkRehypeOptions>({
    allowDangerousHtml: true,
    handlers: {
      [TYPE_TABLE]: mdast2hastGridTablesHandler(),
    },
  });
</script>

{#if inline}
  <Markdown
    {value}
    {sourcePath}
    {remarkPlugins}
    {rehypePlugins}
    {remarkRehypeOptions}
    components={componentMap}
    {linkResolver}
    {assetResolver}
    {frontmatterOpen}
    {frontmatterConfig}
    {dialog}
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
          {remarkRehypeOptions}
          components={componentMap}
          {linkResolver}
          {assetResolver}
          {frontmatterOpen}
          {frontmatterConfig}
          {dialog}
          {onChange}
          {onFrontmatterChange}
        />
      </div>
    </div>
  </div>
{/if}
