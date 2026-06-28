<script lang="ts">
  // @ts-nocheck
  import { EditorView, drawSelection, keymap } from "@codemirror/view";
  import { EditorState } from "@codemirror/state";
  import { history } from "@codemirror/commands";
  import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
  import { cn } from "./utils";
  import { tick } from "svelte";
  import { MarkdownPreview } from "@mira-mde/preview";

  let {
    content,
    onContentChange,
    onEdit = () => true,
    class: className,
  }: {
    content: string;
    class?: string;
    onContentChange: (value: string) => void;
    onEdit?: (evt: MouseEvent) => boolean;
  } = $props();
  let view: EditorView = new EditorView({
    doc: "",
    state: EditorState.create({
      extensions: [
        drawSelection(),
        EditorView.lineWrapping,
        history(),
        EditorView.editable.of(true),
        EditorView.editorAttributes.of({ class: "mod-inline" }),
        markdown({
          base: markdownLanguage,
        }),
        keymap.of([
          {
            key: "Enter",
            run: (view) => {
              // Insert newline and prevent event from bubbling to parent
              view.dispatch({
                changes: { from: view.state.selection.main.head, insert: "\n" },
                selection: { anchor: view.state.selection.main.head + 1 },
              });
              return true; // This prevents the event from propagating
            },
          },
        ]),
        EditorView.domEventHandlers({
          focus: (event, view) => {},
          blur: (event, view) => {
            editing = false;
            const value = view.state.doc.toString();
            if (value !== content) {
              onContentChange(value);
            }
          },
        }),
      ],
    }),
  });

  let editing: boolean = $state(false);

  const codeMirror = (node: HTMLDivElement, content: string) => {
    node.append(view.dom);
    view.dispatch({
      changes: {
        insert: content.trim(),
        from: 0,
        to: view.state.doc.length,
      },
    });
    view.focus();

    return {
      update(value: string) {
        view.dispatch({
          changes: {
            insert: value.trim(),
            from: 0,
            to: view.state.doc.length,
          },
        });
      },
      destroy() {},
    };
  };

  function enableEdit(evt: MouseEvent) {
    editing = onEdit(evt) ?? true;
    if (!editing) return;
    tick().then(() => {
      setTimeout(() => {
        view.focus();
        const pos = view.posAtCoords({ x: evt.clientX, y: evt.clientY }) ?? 0;
        view.dispatch({ selection: { anchor: pos, head: pos } });
      });
    });
  }
</script>

<div class={cn("table-cell-wrapper h-full w-full", className)}>
  {#if editing}
    <div
      use:codeMirror={content}
      class="h-full w-full p-2 ring-[var(--background-modifier-border-focus)] focus-within:rounded-sm focus-within:ring-2"
    ></div>
  {:else}
    <button
      onclick={(evt) => enableEdit(evt)}
      onfocus={(evt) => (editing = true)}
      class={cn("h-full w-full p-2", className)}
    >
      <div class="cm-editor cm-focused mod-inline">
        <div class="cm-scroller">
          <div class="cm-content">
            {#if content}
              <MarkdownPreview inline value={content} />
            {:else}
              &NonBreakingSpace;
            {/if}
          </div>
        </div>
      </div>
    </button>
  {/if}
</div>
