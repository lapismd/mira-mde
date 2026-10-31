<script lang="ts">
  import type { MiraFileAdapter } from "@lapismd/mira/extensions";
  import { MarkdownPreview } from "@lapismd/mira/preview";

  let custom = $state(true);
  let reads = $state(0);
  let exceeded = $state(false);
  const files = new Map([
    ["Self.md", "![[Self.md]]"],
    ["A.md", "![[B.md]]"],
    ["B.md", "![[A.md]]"],
    ["Plain.md", "Repeated sibling content."],
    [
      "Sections.md",
      "# Whole\n\n![[Sections.md#Safe]]\n\n![[Sections.md#^safe-block]]\n\nSafe same-note block. ^safe-block\n\n# Safe\n\nSafe same-note section.",
    ],
  ]);
  const adapter: MiraFileAdapter = {
    resolveLink({ path }) {
      return files.has(path) ? { path, name: path, kind: "markdown" } : null;
    },
    readMarkdown(file) {
      // Bound the broken implementation so the regression fails without
      // exhausting the browser while recursively expanding the fixture.
      reads += 1;
      if (reads > 24) {
        exceeded = true;
        return "Read limit reached.";
      }
      return files.get(file.path) ?? null;
    },
    renderEmbed(_target, host) {
      if (!custom) return false;
      const content = document.createElement("span");
      content.textContent = "Custom embed active.";
      host.append(content);
      return () => content.remove();
    },
  };
  const value = [
    "# Recursive embeds",
    "![[Self.md]]",
    "![[A.md]]",
    "![[A.md]]",
    "![[Plain.md]]",
    "![[Plain.md]]",
    "![[Sections.md]]",
  ].join("\n\n");

  function toggleRenderer() {
    reads = 0;
    custom = !custom;
  }
</script>

<div class="mira-story-surface mira-story-surface--preview">
  <div class="mira-story-actions">
    <button type="button" onclick={toggleRenderer}>
      {custom ? "Withdraw custom renderer" : "Restore custom renderer"}
    </button>
    <output aria-label="Embed reads" data-exceeded={exceeded}>{reads}</output>
  </div>
  <MarkdownPreview {value} fileAdapter={adapter} sourcePath="Report.md" />
</div>
