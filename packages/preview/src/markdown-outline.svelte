<script module lang="ts">
  import { slugHeadingText } from "./outline";

  export type MarkdownOutlineItem = {
    id: string;
    text: string;
    level: number;
  };
</script>

<script lang="ts">
  type Props = {
    value: string;
    headingIdPrefix?: string;
    minLevel?: number;
    maxLevel?: number;
    class?: string;
  };

  let {
    value,
    headingIdPrefix = "",
    minLevel = 1,
    maxLevel = 6,
    class: className = "",
  }: Props = $props();

  const items = $derived(
    extractOutline(value, {
      headingIdPrefix,
      minLevel,
      maxLevel,
    }),
  );

  function extractOutline(
    markdown: string,
    options: {
      headingIdPrefix: string;
      minLevel: number;
      maxLevel: number;
    },
  ): MarkdownOutlineItem[] {
    const counts = new Map<string, number>();
    const headings: MarkdownOutlineItem[] = [];

    for (const line of markdown.split(/\r?\n/)) {
      const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
      if (!match) {
        continue;
      }
      const marker = match[1] ?? "";
      const content = match[2] ?? "";
      const level = marker.length;
      if (level < options.minLevel || level > options.maxLevel) {
        continue;
      }
      const text = content.replace(/[`*_~[\]()]/g, "").trim();
      const slug = `${options.headingIdPrefix}${slugHeadingText(text)}`;
      const count = counts.get(slug) ?? 0;
      counts.set(slug, count + 1);
      headings.push({
        id: count === 0 ? slug : `${slug}-${count}`,
        level,
        text,
      });
    }

    return headings;
  }
</script>

{#if items.length > 0}
  <nav
    class={`mira-markdown-outline ${className}`.trim()}
    aria-label="Table of contents"
  >
    <ol>
      {#each items as item (item.id)}
        <li style={`--mira-outline-level: ${item.level}`}>
          <a href={`#${item.id}`}>{item.text}</a>
        </li>
      {/each}
    </ol>
  </nav>
{/if}
