<script lang="ts">
  import { useAstNode, useMarkdown } from "../renderer/context.svelte";
  import type { HastNode } from "../renderer/types";

  type PositionedNode = HastNode & {
    properties?: Record<string, unknown>;
    position?: {
      start?: { offset?: number };
      end?: { offset?: number };
    };
  };

  type Props = {
    class?: string;
    checked?: boolean | string;
    disabled?: boolean | string;
    ref?: HTMLInputElement | null;
    type?: string;
    [key: string]: unknown;
  };

  let {
    class: className = "",
    checked: checkedProp = false,
    disabled: _disabledProp,
    ref = $bindable(null),
    type: _type,
    ...restProps
  }: Props = $props();

  const node = useAstNode();
  const markdown = useMarkdown();
  const parent = $derived(node.parent as PositionedNode | null);
  const task = $derived((parent?.properties?.["data-task"] || " ") as string);
  const disabled = $derived(!markdown.onChange);
  let checked = $state(false);

  const position = $derived({
    from:
      parent?.position?.start?.offset ??
      numericProperty(parent?.properties?.["data-offset"]) ??
      -1,
    to:
      parent?.position?.end?.offset ??
      numericProperty(parent?.properties?.["data-offset-end"]) ??
      -1,
  });

  const offset = $derived.by(() => {
    let { from, to } = position;
    let value = "";
    let content = "";

    if (from !== -1 && to !== -1) {
      const marker = findTaskMarker(markdown.markdown, from, to);
      if (marker) {
        return marker;
      }
    }

    return { from, to: from + 1, value, content };
  });

  $effect(() => {
    checked = isChecked(checkedProp);
  });

  function isChecked(value: boolean | string | undefined): boolean {
    return value === true || value === "" || value === "true";
  }

  function numericProperty(value: unknown): number | undefined {
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  }

  function findTaskMarker(
    source: string,
    from: number,
    to: number,
  ): { from: number; to: number; value: string; content: string } | null {
    const lineStart = source.lastIndexOf("\n", Math.max(0, from - 1)) + 1;
    const nextLine = source.indexOf("\n", from);
    const lineEnd = nextLine === -1 ? source.length : nextLine;
    const content = source.slice(lineStart, Math.max(lineEnd, to));
    const match = content.match(/^(\s*(?:[*+-]|\d+[.)])\s*\[)(.)\]/u);

    if (!match) {
      return null;
    }

    const markerFrom = lineStart + (match[1]?.length ?? 0);
    return {
      from: markerFrom,
      to: markerFrom + 1,
      value: (match[2] ?? " ").toLowerCase(),
      content,
    };
  }

  function onCheckedChange(value: boolean): void {
    checked = value;
    if (ref?.parentElement) {
      ref.parentElement.dataset.task = value ? "x" : task;
    }
    if (node.node.type === "element") {
      node.node.properties ??= {};
      node.node.properties.checked = value;
    }
    markdown.onChange?.(value ? "x" : " ", offset.from, offset.to);
  }

  function handleChange(event: Event): void {
    onCheckedChange((event.currentTarget as HTMLInputElement).checked);
  }
</script>

<input
  bind:this={ref}
  {...restProps}
  class={`task-list-item-checkbox ${className}`.trim()}
  type="checkbox"
  data-task={task}
  {checked}
  {disabled}
  onchange={handleChange}
/>
