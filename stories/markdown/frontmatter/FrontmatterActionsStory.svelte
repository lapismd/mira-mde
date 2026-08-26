<script lang="ts">
  import {
    MarkdownPreview,
    type FrontmatterConfig,
  } from "@lapismd/mira/preview";
  import { storyFileAdapter } from "../_shared/file-adapter";
  import { frontmatterMarkdown } from "../fixtures";

  let value = $state(frontmatterMarkdown);
  let clipboardValue = "";

  const frontmatterConfig: FrontmatterConfig = {
    propertySuggestions: [
      { name: "owner", kind: "aliases" },
      { name: "review-status", icon: "lucide-circle-check" },
      { name: "summary", kind: "text" },
    ],
    valueSuggestions: (key) =>
      ({
        status: ["draft", "approved", "in review"],
        tags: ["markdown", "properties", "release"],
        aliases: ["Markdown metadata", "Release metadata"],
      })[key] ?? [],
    clipboard: {
      readText: () => clipboardValue,
      writeText(nextValue) {
        clipboardValue = nextValue;
      },
    },
  };

  function applyChange(replacement: string, from: number, to: number): void {
    value = `${value.slice(0, from)}${replacement}${value.slice(to)}`;
  }
</script>

<div class="mira-story-surface mira-story-surface--preview">
  <p class="mira-story-note">
    Focus a property name for suggestions. Open its icon menu for type, cut,
    copy, paste, and remove actions.
  </p>
  <MarkdownPreview
    {value}
    sourcePath="frontmatter-actions.md"
    fileAdapter={storyFileAdapter}
    {frontmatterConfig}
    onChange={applyChange}
  />
</div>
