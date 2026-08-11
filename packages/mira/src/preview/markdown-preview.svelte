<script lang="ts">
  import { tick } from "svelte";
  import rehypeHighlight from "rehype-highlight";
  import rehypeKatex from "rehype-katex";
  import rehypeRaw from "rehype-raw";
  import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
  import remarkGridTables from "@adobe/remark-gridtables";
  import {
    TYPE_TABLE,
    mdast2hastGridTablesHandler,
  } from "@adobe/mdast-util-gridtables";
  import remarkDirective from "remark-directive";
  import remarkFrontmatter from "remark-frontmatter";
  import remarkGfm from "remark-gfm";
  import remarkMath from "remark-math";
  import remarkEmoji from "remark-emoji";
  import type {
    MiraAssetResolver,
    MiraExtension,
    MiraFileAdapter,
    MiraListCallout,
    MiraLinkResolver,
    MiraMarkdownPostProcessor,
    MiraRendererComponents,
  } from "@lapismd/mira/extensions";
  import {
    mountMiraExtensionStyles,
    resolveMiraExtensions,
    resolveMiraListCallouts,
  } from "@lapismd/mira/extensions";
  import Markdown from "./renderer/markdown.svelte";
  import {
    remarkCallouts,
    remarkCustomChecklists,
    remarkDirectivesToHast,
    remarkExternalLinks,
    remarkFrontmatterToHast,
    remarkHeadings,
    remarkListCallouts,
    remarkMultimarkdownTable,
    remarkPathLinks,
    remarkPositionsToData,
    remarkTags,
    remarkWikiLinks,
    isExternalMarkdownDestination,
  } from "./remark";
  import Callout from "./components/callout.svelte";
  import Checkbox from "./components/checkbox.svelte";
  import Code from "./components/code.svelte";
  import Embed from "./components/embed.svelte";
  import Frontmatter from "./components/frontmatter.svelte";
  import Image from "./components/image.svelte";
  import ListItem from "./components/list-item.svelte";
  import ListCalloutMarker from "./components/list-callout-marker.svelte";
  import Link from "./components/link.svelte";
  import Tag from "./components/tag.svelte";
  import rehypeCodeContext from "./rehype-code-context";
  import { rehypeHighlightLines } from "./rehype-highlight-lines";
  import { rehypeTableSpans } from "./rehype-table-spans";
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
    fileAdapter?: MiraFileAdapter;
    frontmatterOpen?: boolean;
    frontmatterConfig?: FrontmatterConfig;
    headingIds?: boolean;
    headingIdPrefix?: string;
    htmlPolicy?: "trusted" | "safe";
    emoji?: boolean;
    dialog?: boolean;
    listCallouts?: MiraListCallout[];
    postProcess?: MiraMarkdownPostProcessor;
    onChange?: (replacement: string, from: number, to: number) => void;
    onFrontmatterChange?: (nextYaml: string, nextValue: string) => void;
  };

  type HeadingElement = HTMLElement & {
    dataset: HTMLElement["dataset"] & {
      headingCollapsed?: string;
      headingLevel?: string;
    };
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
    fileAdapter,
    frontmatterOpen = true,
    frontmatterConfig,
    headingIds = false,
    headingIdPrefix = "",
    htmlPolicy = "trusted",
    emoji = false,
    dialog = false,
    listCallouts = [],
    postProcess,
    onChange,
    onFrontmatterChange,
  }: Props = $props();

  let documentEl: HTMLDivElement | null = $state(null);
  let cleanupHeadingCollapse: (() => void) | null = null;

  const builtInComponents: MiraRendererComponents = {
    callout: Callout,
    code: Code,
    embed: Embed,
    frontmatter: Frontmatter,
    img: Image,
    input: Checkbox,
    li: ListItem,
    listcalloutmarker: ListCalloutMarker,
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

  $effect(() => {
    return mountMiraExtensionStyles(resolvedExtensions.styles);
  });

  const listCalloutContributions = $derived([
    ...resolvedExtensions.listCallouts,
    ...listCallouts,
  ]);
  const resolvedListCallouts = $derived(
    resolveMiraListCallouts(listCalloutContributions),
  );
  const resolvedPostProcess = $derived<MiraMarkdownPostProcessor>(
    (contentEl, node, parent) => {
      const cleanups = [
        ...resolvedExtensions.postProcessors,
        ...(postProcess ? [postProcess] : []),
      ]
        .map((processor) => processor(contentEl, node, parent))
        .filter(
          (cleanup): cleanup is () => void => typeof cleanup === "function",
        );

      if (cleanups.length) {
        return () => {
          for (const cleanup of cleanups.reverse()) {
            cleanup();
          }
        };
      }
    },
  );

  const remarkPlugins = $derived<Pluggable[]>([
    remarkFrontmatter,
    remarkDirective,
    remarkGridTables,
    remarkGfm,
    ...(emoji ? [remarkEmoji] : []),
    remarkMultimarkdownTable,
    remarkCustomChecklists,
    [remarkListCallouts, { callouts: listCalloutContributions }],
    remarkMath,
    remarkCallouts,
    remarkWikiLinks,
    remarkPathLinks,
    remarkExternalLinks,
    remarkTags,
    [remarkHeadings, { ids: headingIds, prefix: headingIdPrefix }],
    remarkDirectivesToHast,
    remarkFrontmatterToHast,
    remarkPositionsToData,
    ...resolvedExtensions.remarkPlugins,
  ]);

  const miraSanitizeSchema = {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      "*": [
        ...(defaultSchema.attributes?.["*"] ?? []),
        "class",
        "data-heading",
        "data-line",
        "data-list-callout-marker",
        "data-mira-doodle-divider-seed",
        "data-callout-char",
        "data-callout-icon",
        "data-offset",
        "data-offset-end",
        "data-sourcepos",
      ],
      img: [...(defaultSchema.attributes?.img ?? []), "src", "alt", "title"],
      a: [
        ...(defaultSchema.attributes?.a ?? []),
        "href",
        "title",
        "target",
        "rel",
      ],
    },
    protocols: {
      ...defaultSchema.protocols,
      href: ["http", "https", "mailto", "tel"],
      src: ["http", "https", "data"],
    },
  };

  const rehypePlugins = $derived<Pluggable[]>([
    rehypeCodeContext,
    rehypeTableSpans,
    ...(highlight ? [rehypeHighlight, rehypeHighlightLines] : []),
    rehypeRaw,
    ...(htmlPolicy === "safe"
      ? ([[rehypeSanitize, miraSanitizeSchema]] as Pluggable[])
      : []),
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
      wikilink(state: any, node: any) {
        return state.applyData(node, {
          type: "element",
          tagName: "wikilink",
          properties: linkNodeProperties(node),
          children: state.all(node),
        });
      },
      link(state: any, node: any) {
        if (isExternalMarkdownDestination(node.url)) {
          const result = {
            type: "element",
            tagName: "a",
            properties: {
              href: node.url,
              ...(node.title ? { title: node.title } : {}),
              ...(node.data?.hProperties ?? {}),
            },
            children: state.all(node),
          };

          state.patch(node, result);
          return state.applyData(node, result);
        }

        const text = nodeText(node.children ?? []);

        return state.applyData(node, {
          type: "element",
          tagName: "pathlink",
          properties: {
            href: node.url,
            id: node.url,
            label: text,
            text,
          },
          children: state.all(node),
        });
      },
      pathlink(state: any, node: any) {
        return state.applyData(node, {
          type: "element",
          tagName: "pathlink",
          properties: linkNodeProperties(node),
          children: state.all(node),
        });
      },
      embed(state: any, node: any) {
        return state.applyData(node, {
          type: "element",
          tagName: "embed",
          properties: linkNodeProperties(node),
          children: state.all(node),
        });
      },
    } as any,
  });

  function linkNodeProperties(node: any): Record<string, unknown> {
    const data = node.data ?? {};
    const hProperties = data.hProperties ?? {};
    const id =
      data.id ?? hProperties.id ?? hProperties.href ?? node.value ?? "";
    const text =
      data.text ?? hProperties.text ?? hProperties.label ?? node.value ?? id;

    return {
      ...hProperties,
      href: hProperties.href ?? id,
      id,
      label: hProperties.label ?? text,
      text,
    };
  }

  function nodeText(children: any[]): string {
    return children
      .map((child) => {
        if (typeof child.value === "string") {
          return child.value;
        }
        return Array.isArray(child.children) ? nodeText(child.children) : "";
      })
      .join("");
  }

  $effect(() => {
    value;
    inline;
    embed;
    documentEl;

    if (inline || embed || !documentEl) {
      return;
    }

    let cancelled = false;
    void tick().then(() => {
      if (cancelled || !documentEl) {
        return;
      }
      cleanupHeadingCollapse?.();
      cleanupHeadingCollapse = installHeadingCollapse(documentEl);
    });

    return () => {
      cancelled = true;
      cleanupHeadingCollapse?.();
      cleanupHeadingCollapse = null;
    };
  });

  function installHeadingCollapse(root: HTMLElement): () => void {
    const buttons: HTMLButtonElement[] = [];
    const headings = Array.from(
      root.querySelectorAll<HeadingElement>("h1,h2,h3,h4,h5,h6"),
    );

    for (const heading of headings) {
      if (heading.querySelector(":scope > .heading-collapse-indicator")) {
        continue;
      }

      const button = document.createElement("button");
      button.type = "button";
      button.className = "heading-collapse-indicator";
      button.setAttribute("aria-label", "Collapse section");
      button.setAttribute("aria-expanded", "true");
      button.innerHTML = [
        '<svg class="svg-icon" aria-hidden="true" viewBox="0 0 24 24" ',
        'fill="none" stroke="currentColor" stroke-width="2" ',
        'stroke-linecap="round" stroke-linejoin="round">',
        '<path d="m6 9 6 6 6-6"></path>',
        "</svg>",
      ].join("");

      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const collapsed = heading.dataset.headingCollapsed !== "true";
        setHeadingCollapsed(heading, collapsed);
      });

      heading.insertBefore(button, heading.firstChild);
      buttons.push(button);
    }

    return () => {
      for (const button of buttons) {
        button.remove();
      }
      for (const heading of headings) {
        delete heading.dataset.headingCollapsed;
      }
      for (const element of root.querySelectorAll<HTMLElement>(
        "[data-heading-section-collapsed]",
      )) {
        delete element.dataset.headingSectionCollapsed;
      }
    };
  }

  function setHeadingCollapsed(
    heading: HeadingElement,
    collapsed: boolean,
  ): void {
    const button = heading.querySelector<HTMLButtonElement>(
      ":scope > .heading-collapse-indicator",
    );
    heading.dataset.headingCollapsed = collapsed ? "true" : "false";
    button?.setAttribute("aria-expanded", collapsed ? "false" : "true");
    button?.setAttribute(
      "aria-label",
      collapsed ? "Expand section" : "Collapse section",
    );

    const level = Number.parseInt(heading.tagName.slice(1), 10);
    let current = heading.nextElementSibling as HTMLElement | null;
    while (current) {
      if (
        /^H[1-6]$/u.test(current.tagName) &&
        Number.parseInt(current.tagName.slice(1), 10) <= level
      ) {
        break;
      }

      if (collapsed) {
        current.dataset.headingSectionCollapsed = "true";
      } else {
        delete current.dataset.headingSectionCollapsed;
      }
      current = current.nextElementSibling as HTMLElement | null;
    }
  }
</script>

{#if inline}
  <Markdown
    {value}
    {sourcePath}
    {extensions}
    {remarkPlugins}
    {rehypePlugins}
    {remarkRehypeOptions}
    components={componentMap}
    {linkResolver}
    {assetResolver}
    {fileAdapter}
    {frontmatterOpen}
    {frontmatterConfig}
    {dialog}
    listCallouts={resolvedListCallouts}
    postProcess={resolvedPostProcess}
    {onChange}
    {onFrontmatterChange}
  />
{:else}
  <div
    class={`mira-markdown-preview markdown-reading-view markdown-preview-surface markdown-preview-surface--reading markdown-rendered ${embed ? "markdown-preview-surface--embedded markdown-embed-surface" : ""} ${className}`.trim()}
    data-markdown-embed={embed ? true : undefined}
  >
    <div class="cm-sizer">
      <div bind:this={documentEl} class="markdown-view__document markdown">
        <Markdown
          {value}
          {sourcePath}
          {extensions}
          {remarkPlugins}
          {rehypePlugins}
          {remarkRehypeOptions}
          components={componentMap}
          {linkResolver}
          {assetResolver}
          {fileAdapter}
          {frontmatterOpen}
          {frontmatterConfig}
          {dialog}
          listCallouts={resolvedListCallouts}
          postProcess={resolvedPostProcess}
          {onChange}
          {onFrontmatterChange}
        />
      </div>
    </div>
  </div>
{/if}
