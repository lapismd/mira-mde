<script lang="ts">
  import { onMount } from "svelte";
  import { EditorView } from "@codemirror/view";
  import { createMiraCodeMirrorExtensions } from "@lapismd/mira/core";

  let container: HTMLDivElement;
  onMount(() => {
    const view = new EditorView({
      parent: container,
      doc: "## Focus\n\n- Describe the incident response and the changes to the runbook.\n* Keep the mentoring example concrete and show the outcome for the team.\n+ Connect platform work to product delivery.\n",
      extensions: [
        createMiraCodeMirrorExtensions({
          mode: "live-preview",
          lineWrapping: true,
          runtimeContext: (editor) => ({
            view: editor,
            mode: "live-preview",
            getValue: () => editor.state.doc.toString(),
            setValue: (value) =>
              editor.dispatch({
                changes: {
                  from: 0,
                  to: editor.state.doc.length,
                  insert: value,
                },
              }),
            focus: () => editor.focus(),
            insertMarkdown: (value) =>
              editor.dispatch(editor.state.replaceSelection(value)),
          }),
        }),
        EditorView.editorAttributes.of({ class: "markdown-editor-surface" }),
        EditorView.theme({
          "&": {
            height: "auto",
            "--file-margins-x": "1rem",
            "--file-margins-y": "1rem",
          },
        }),
      ],
    });
    return () => view.destroy();
  });
</script>

<div bind:this={container} style="max-width: 28rem;"></div>
