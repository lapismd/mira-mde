<script lang="ts">
  import CheckIcon from "@lucide/svelte/icons/check";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import ListPlusIcon from "@lucide/svelte/icons/list-plus";
  import SparklesIcon from "@lucide/svelte/icons/sparkles";
  import {
    MiraDefaultMde,
    MiraFeature,
    type MiraDefaultMdeHandle,
    type MiraDefaultToolbarActionContext,
    type MiraDefaultToolbarDefinition
  } from "@mira-mde/default-ui/svelte";
  import type { MiraMode } from "@mira-mde/extensions";
  import { toolbarMarkdown } from "../data/examples";
  import { docsFileAdapter } from "../lib/file-adapter";

  let editor = $state<MiraDefaultMdeHandle | null>(null);
  let value = $state(toolbarMarkdown);
  let mode = $state<MiraMode>("live-preview");

  const features = {
    [MiraFeature.Mermaid]: true
  };

  const customToolbars: MiraDefaultToolbarDefinition[] = [
    {
      id: "docs-toolbar",
      label: "Docs actions",
      align: "start",
      items: [
        {
          id: "insert-callout",
          label: "Insert tip",
          icon: SparklesIcon,
          run(context: MiraDefaultToolbarActionContext) {
            context.insertMarkdown(
              "\n> [!tip] Custom toolbar\n> This callout came from a declarative toolbar button.\n"
            );
          }
        },
        {
          type: "dropdown",
          id: "insert-template",
          label: "Insert template",
          icon: ListPlusIcon,
          items: [
            {
              type: "label",
              label: "Templates"
            },
            {
              id: "template-checklist",
              label: "Checklist",
              icon: CheckIcon,
              run(context: MiraDefaultToolbarActionContext) {
                context.insertMarkdown(
                  "\n- [ ] First task\n- [ ] Second task\n- [ ] Third task\n"
                );
              }
            },
            {
              id: "template-section",
              label: "Section",
              icon: FileTextIcon,
              run(context: MiraDefaultToolbarActionContext) {
                context.insertMarkdown(
                  "\n## New section\n\nAdd details for this section.\n"
                );
              }
            }
          ]
        }
      ]
    }
  ];

  function resetExample(): void {
    value = toolbarMarkdown;
    mode = "live-preview";
    editor?.setMarkdown(toolbarMarkdown);
    editor?.setMode("live-preview");
  }
</script>

<section
  class="docs-live-editor"
  style="--docs-live-editor-height: 28rem;"
>
  <div class="docs-live-editor__header">
    <div>
      <p class="docs-live-editor__title">Declarative custom toolbar</p>
      <p class="docs-live-editor__description">
        Custom sections can add icon buttons and dropdowns without replacing the
        default toolbar.
      </p>
    </div>
    <button class="docs-live-editor__reset" type="button" onclick={resetExample}>
      Reset
    </button>
  </div>

  <MiraDefaultMde
    bind:this={editor}
    bind:value
    bind:mode={mode}
    {features}
    fileAdapter={docsFileAdapter}
    toolbars={customToolbars}
    class="docs-live-editor__surface"
    sourcePath="toolbar.md"
  />
</section>
