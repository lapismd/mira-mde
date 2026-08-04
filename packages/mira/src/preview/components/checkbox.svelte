<script lang="ts">
  import TaskCheckboxControl from "./task-checkbox-control.svelte";
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
    const match = content.match(/^(\s*(?:>\s*)*(?:[*+-]|\d+[.)])\s*\[)(.)\]/u);

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

  function applyTaskValue(value: string): void {
    checked = value.trim().length > 0;
    if (ref?.parentElement) {
      ref.parentElement.dataset.task = value;
    }
    if (parent?.properties) {
      parent.properties["data-task"] = value;
    }
    if (node.node.type === "element") {
      node.node.properties ??= {};
      node.node.properties.checked = checked;
    }
    markdown.onChange?.(value, offset.from, offset.to);
  }

  function onCheckedChange(value: boolean): void {
    applyTaskValue(value ? "x" : " ");
  }
</script>

{#if disabled}
  <input
    bind:this={ref}
    {...restProps}
    class={`task-list-item-checkbox ${className}`.trim()}
    type="checkbox"
    aria-label="Toggle task"
    data-task={task}
    {checked}
    {disabled}
  />
{:else}
  <span class="task-list-label" data-task={task}>
    <TaskCheckboxControl
      bind:ref
      {...restProps}
      checkboxClass={className}
      {task}
      {checked}
      {onCheckedChange}
      onTaskChange={applyTaskValue}
    />
  </span>
{/if}
