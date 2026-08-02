# @lapismd/mira-editor

Opinionated, batteries-included Svelte editor for quick onboarding. The package
root defaults to `MiraEditor` and also exports `MiraEditorToolbar`, feature
configuration, and toolbar helpers.

```svelte
<script lang="ts">
  import {
    MiraEditor,
    MiraEditorToolbar,
    MiraFeature,
  } from "@lapismd/mira-editor";
  import SparklesIcon from "@lucide/svelte/icons/sparkles";
  import Settings2Icon from "@lucide/svelte/icons/settings-2";
  import "@lapismd/mira-editor/styles.css";

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

<MiraEditorToolbar bind:mode {value} {toolbars} />

<MiraEditor
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

For DOM mounting without a Svelte application, use `createMiraEditor` from
`@lapismd/mira-vanilla`.
