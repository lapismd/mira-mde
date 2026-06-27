<script lang="ts">
  import { untrack } from "svelte";
  import type { Component as SvelteComponent } from "svelte";
  import Renderer from "./renderer.svelte";
  import {
    getNodeRenderKey,
    setAstNodeContext,
    useMarkdownContext,
  } from "./context.svelte";
  import { resolveComponent } from "./utils";
  import type { HastNode } from "./types";

  type Props = {
    astNode: HastNode;
    parent: HastNode | null;
  };

  let { astNode, parent }: Props = $props();
  const markdown = useMarkdownContext();
  let contentEl: HTMLElement | null = $state(null);
  let astContext = setAstNodeContext({ node: {} as HastNode, parent: null });

  const children = $derived(
    "children" in astNode && Array.isArray(astNode.children)
      ? (astNode.children as HastNode[])
      : [],
  );
  const tagName = $derived(astNode.type === "element" ? astNode.tagName : "");
  const componentKey = $derived(
    astNode.type === "element" &&
      typeof astNode.properties?.["data-directive"] === "string" &&
      markdown.components[
        `directive:${astNode.properties["data-directive"]}`
      ] !== undefined
      ? `directive:${astNode.properties["data-directive"]}`
      : tagName,
  );
  const Component = $derived(
    resolveComponent(markdown.components, componentKey),
  );
  const ResolvedComponent = $derived(
    typeof Component === "string"
      ? null
      : (Component as SvelteComponent<any, any, any> | null | undefined),
  );
  const properties = $derived(
    astNode.type === "element" ? (astNode.properties ?? {}) : {},
  );

  $effect(() => {
    astContext.node = astNode;
    astContext.parent = parent;
  });

  $effect(() => {
    if (contentEl) {
      untrack(() => {
        markdown.postProcess?.(contentEl as HTMLElement, astNode, parent);
      });
    }
  });
</script>

{#if astNode.type === "root"}
  {#each children as child, index (getNodeRenderKey(child, index))}
    <Renderer astNode={child} parent={astNode} />
  {/each}
{:else if astNode.type === "element"}
  {#if typeof Component === "string"}
    <svelte:element this={Component} bind:this={contentEl} {...properties}>
      {#each children as child, index (getNodeRenderKey(child, index))}
        <Renderer astNode={child} parent={astNode} />
      {/each}
    </svelte:element>
  {:else if ResolvedComponent}
    <ResolvedComponent
      bind:ref={contentEl}
      {tagName}
      sourcePath={markdown.sourcePath}
      {...properties}
    >
      {#each children as child, index (getNodeRenderKey(child, index))}
        <Renderer astNode={child} parent={astNode} />
      {/each}
    </ResolvedComponent>
  {/if}
{:else if astNode.type === "text"}
  {astNode.value}
{:else if astNode.type === "comment"}
  {@html `<!-- ${astNode.value} -->`}
{/if}
