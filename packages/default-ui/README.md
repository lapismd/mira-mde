# @mira-mde/default-ui

Opinionated, batteries-included Mira MDE package for quick onboarding.

## Vanilla

```ts
import { createMiraDefaultEditor, MiraFeature } from "@mira-mde/default-ui";
import "@mira-mde/default-ui/styles.css";

const editor = createMiraDefaultEditor({
  root: document.getElementById("editor")!,
  value: "# Hello Mira",
  defaultEditMode: "live-preview",
  mode: "live-preview",
  features: {
    [MiraFeature.Tables]: true,
    [MiraFeature.Mermaid]: true,
  },
  onChange(markdown) {
    console.log(markdown);
  },
});

editor.focus();
editor.getMarkdown();
editor.setMarkdown("# Updated");
editor.setMode("preview");
editor.destroy();
```

Custom toolbar actions can be passed directly. Toolbar buttons are icon-only and
use their `label` or `tooltip` for the hover/focus tooltip.

```ts
import SparklesIcon from "@lucide/svelte/icons/sparkles";

createMiraDefaultEditor({
  root: document.getElementById("editor")!,
  toolbarActions: [
    {
      id: "insert-summary",
      label: "Insert summary",
      icon: SparklesIcon,
      run(editor) {
        editor.insertMarkdown("\n## Summary\n\n");
      },
    },
  ],
});
```

## Svelte

```svelte
<script lang="ts">
  import {
    MiraDefaultMde,
    MiraDefaultToolbar,
    MiraFeature,
  } from "@mira-mde/default-ui/svelte";
  import SparklesIcon from "@lucide/svelte/icons/sparkles";
  import Settings2Icon from "@lucide/svelte/icons/settings-2";
  import "@mira-mde/default-ui/styles.css";

  let value = "# Hello Mira";
  let mode = "live-preview";

  const toolbars = [
    {
      id: "document",
      label: "Document",
      align: "start",
      items: [
        {
          id: "insert-summary",
          label: "Insert summary",
          icon: SparklesIcon,
          run(editor) {
            editor.insertMarkdown("\n## Summary\n\n");
          },
        },
        {
          type: "dropdown",
          id: "settings",
          label: "Document settings",
          icon: Settings2Icon,
          items: [
            {
              id: "insert-frontmatter",
              label: "Insert frontmatter",
              run(editor) {
                editor.insertMarkdown("---\ntitle: Untitled\n---\n\n");
              },
            },
          ],
        },
      ],
    },
  ];
</script>

<MiraDefaultToolbar bind:mode {value} {toolbars} />

<MiraDefaultMde
  bind:value
  bind:mode
  defaultEditMode="live-preview"
  features={{
    [MiraFeature.Tables]: true,
    [MiraFeature.Mermaid]: true,
    [MiraFeature.Toolbar]: false,
  }}
/>
```
