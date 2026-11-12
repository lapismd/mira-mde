<script lang="ts">
  import { MarkdownPreview } from "@lapismd/mira/preview";
  let expanded = $state(false);
  const value =
    "# Keyboard scrolling\n\n" +
    Array.from(
      { length: 12 },
      (_, index) => `Paragraph ${index + 1} stays reachable by keyboard.`,
    ).join("\n\n");
</script>

<div class="mira-story-surface">
  <button
    type="button"
    onclick={() => {
      expanded = true;
    }}>Expand preview</button
  >
  <div style:height={expanded ? "4000px" : "120px"} style:width="320px">
    <MarkdownPreview {value} sourcePath="Scroll.md" />
  </div>
</div>
