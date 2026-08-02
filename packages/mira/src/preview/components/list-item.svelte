<script lang="ts">
  import type { Snippet } from "svelte";
  import { useAstNode } from "../renderer/context.svelte";

  type Props = {
    children?: Snippet;
    class?: string;
    ref?: HTMLLIElement | null;
    [key: string]: unknown;
  };

  let {
    children,
    class: className = "",
    ref = $bindable(null),
    ...props
  }: Props = $props();

  const astNode = useAstNode();
  const showIndentGuides = true;
  const showFold = true;
  let collapsed = $state(false);
  let collapseAnchorTop = $state<number | null>(null);

  const listKind = $derived(
    astNode.parent?.type === "element" && astNode.parent.tagName === "ol"
      ? "ol"
      : "ul",
  );

  const hasNestedList = $derived.by(
    () =>
      "children" in astNode.node &&
      Array.isArray(astNode.node.children) &&
      astNode.node.children.some(
        (child: any) =>
          child.type === "element" &&
          (child.tagName === "ul" || child.tagName === "ol"),
      ),
  );

  const isTask = $derived(className.split(/\s+/u).includes("task-list-item"));

  const liClass = $derived(
    [
      className,
      "rendered-list-item",
      `rendered-list-item-${listKind}`,
      hasNestedList ? "has-nested-list" : "",
      collapsed ? "is-collapsed" : "",
      showIndentGuides ? "show-guides" : "",
    ]
      .filter(Boolean)
      .join(" "),
  );

  function toggleCollapsed(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    collapsed = !collapsed;
  }

  function isIgnoredAnchorElement(node: Element): boolean {
    return (
      node.classList.contains("list-collapse-indicator") ||
      node.classList.contains("list-bullet") ||
      node.tagName === "UL" ||
      node.tagName === "OL"
    );
  }

  function getAnchorRect(node: Node): DOMRect | null {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node.textContent?.trim()) {
        return null;
      }

      const range = document.createRange();
      range.selectNodeContents(node);
      const rect = range.getBoundingClientRect();
      range.detach();
      return rect.width || rect.height ? rect : null;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      if (isIgnoredAnchorElement(element) || !element.textContent?.trim()) {
        return null;
      }

      const rect = element.getBoundingClientRect();
      return rect.width || rect.height ? rect : null;
    }

    return null;
  }

  function updateCollapseAnchor(): void {
    if (!ref || !showFold || !hasNestedList) {
      collapseAnchorTop = null;
      return;
    }

    const liRect = ref.getBoundingClientRect();

    for (const child of ref.childNodes) {
      const rect = getAnchorRect(child);
      if (!rect) {
        continue;
      }

      collapseAnchorTop = rect.top - liRect.top + rect.height / 2;
      return;
    }

    collapseAnchorTop = null;
  }

  $effect(() => {
    hasNestedList;
    ref;

    if (!showFold || !hasNestedList || !ref) {
      collapseAnchorTop = null;
      return;
    }

    const frame = requestAnimationFrame(updateCollapseAnchor);
    return () => cancelAnimationFrame(frame);
  });
</script>

<li bind:this={ref} {...props} class={liClass}>
  {#if hasNestedList && showFold}
    <button
      type="button"
      class="list-collapse-indicator"
      aria-label={collapsed ? "Expand list" : "Collapse list"}
      data-collapsed={collapsed ? "true" : "false"}
      style:top={collapseAnchorTop !== null
        ? `${collapseAnchorTop}px`
        : undefined}
      onclick={toggleCollapsed}
    >
      <span class="collapse-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="svg-icon"
          style:transform={collapsed ? "rotate(-90deg)" : undefined}
        >
          <path d="M3 8L12 17L21 8"></path>
        </svg>
      </span>
    </button>
  {/if}
  {#if listKind === "ul" && !isTask}
    <span class="list-bullet" aria-hidden="true"></span>
  {/if}
  {@render children?.()}
</li>
